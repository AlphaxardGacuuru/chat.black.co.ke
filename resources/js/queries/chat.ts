import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AxiosResponse } from "axios"
import ChatThreadController from "@/actions/App/Http/Controllers/Chat/ChatThreadController"
import ChatMessageController from "@/actions/App/Http/Controllers/Chat/ChatMessageController"
import ChatLabelController from "@/actions/App/Http/Controllers/Chat/ChatLabelController"
import Axios from "@/lib/axios"
import type {
	ChatComposeMode,
	ChatComposePayload,
	ChatLabel,
	ChatThread,
	ChatThreadSummary,
} from "@/types/chat"

export type ChatThreadFilters = {
	folder: string
	label?: string
	q?: string
	page?: number
}

type Paginated<T> = {
	data: T[]
	meta: {
		current_page: number
		last_page: number
		total: number
	}
}

function threadsQueryKey(filters: ChatThreadFilters) {
	return ["chat", "threads", filters] as const
}

function updateThreadLists(
	queryClient: ReturnType<typeof useQueryClient>,
	threadId: string,
	shouldInclude: (filters: ChatThreadFilters) => boolean,
	patch: (thread: ChatThreadSummary) => ChatThreadSummary
) {
	const queries = queryClient.getQueriesData<Paginated<ChatThreadSummary>>({
		queryKey: ["chat", "threads"],
	})
	const sourceThread = queries
		.map(([, existing]) => existing?.data.find((thread) => thread.id === threadId))
		.find((thread): thread is ChatThreadSummary => !!thread)

	queries.forEach(([key, existing]) => {
		if (!existing) {
			return
		}

		const filters = key[2] as ChatThreadFilters
		const shouldBeIncluded = shouldInclude(filters)
		const hasThread = existing.data.some((thread) => thread.id === threadId)
		let data = existing.data

		if (shouldBeIncluded && !hasThread && sourceThread) {
			data = [patch(sourceThread), ...data]
		} else if (!shouldBeIncluded) {
			data = data.filter((thread) => thread.id !== threadId)
		} else {
			data = data.map((thread) => (thread.id === threadId ? patch(thread) : thread))
		}

		queryClient.setQueryData(key, { ...existing, data })
	})
}

export function useChatThreads(filters: ChatThreadFilters) {
	return useQuery({
		queryKey: threadsQueryKey(filters),
		queryFn: () =>
			Axios.get<Paginated<ChatThreadSummary>>(
				ChatThreadController.index.url({
					query: {
						folder: filters.folder,
						...(filters.label ? { label: filters.label } : {}),
						...(filters.q ? { q: filters.q } : {}),
						page: filters.page ?? 1,
					},
				})
			).then((res) => res.data),
		placeholderData: keepPreviousData,
	})
}

export function useChatThread(threadId: string | null) {
	const queryClient = useQueryClient()

	return useQuery({
		queryKey: ["chat", "thread", threadId],
		queryFn: () =>
			Axios.get<{ data: ChatThread }>(ChatThreadController.show.url(threadId as string)).then((res) => {
				queryClient.setQueriesData<Paginated<ChatThreadSummary>>(
					{ queryKey: ["chat", "threads"] },
					(existing) => {
						if (!existing) {
							return existing
						}

						return {
							...existing,
							data: existing.data.map((thread) =>
								thread.id === threadId ? { ...thread, hasUnread: false } : thread
							),
						}
					}
				)

				return res.data.data
			}),
		enabled: !!threadId,
	})
}

export function useLabels() {
	return useQuery({
		queryKey: ["chat", "labels"],
		queryFn: () => Axios.get<{ data: ChatLabel[] }>(ChatLabelController.index.url()).then((res) => res.data.data),
		staleTime: 5 * 60_000,
	})
}

function useOptimisticThreadMutation(
	mutationFn: (threadId: string) => Promise<AxiosResponse>,
	patch: (thread: ChatThreadSummary) => ChatThreadSummary,
	shouldInclude: (filters: ChatThreadFilters) => boolean = () => true
) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn,
		onMutate: async (threadId: string) => {
			await queryClient.cancelQueries({ queryKey: ["chat", "threads"] })

			const previous = queryClient.getQueriesData<Paginated<ChatThreadSummary>>({
				queryKey: ["chat", "threads"],
			})

			updateThreadLists(queryClient, threadId, shouldInclude, patch)

			return { previous }
		},
		onError: (_err, _threadId, context) => {
			context?.previous.forEach(([key, data]) => {
				queryClient.setQueryData(key, data)
			})
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["chat", "threads"] })
		},
	})
}

export function useStarChatThread(starred: boolean) {
	return useOptimisticThreadMutation(
		(id) => Axios.patch(ChatThreadController.update.url(id), { isStarred: starred }),
		(thread) => ({ ...thread, isStarred: starred }),
		(filters) => filters.folder !== "starred" || starred
	)
}

export function useMarkChatThreadRead(read: boolean) {
	return useOptimisticThreadMutation(
		(id) => Axios.patch(ChatThreadController.update.url(id), { isRead: read }),
		(thread) => ({ ...thread, hasUnread: !read })
	)
}

function useMoveThreadMutation(
	mutationFn: (threadId: string) => Promise<AxiosResponse>,
	destinationFolder: string | null
) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn,
		onMutate: async (threadId: string) => {
			await queryClient.cancelQueries({ queryKey: ["chat", "threads"] })

			const previous = queryClient.getQueriesData<Paginated<ChatThreadSummary>>({
				queryKey: ["chat", "threads"],
			})

			updateThreadLists(
				queryClient,
				threadId,
				(filters) =>
					destinationFolder !== null &&
					(filters.folder === destinationFolder || filters.folder === "starred"),
				(thread) => thread
			)

			return { previous }
		},
		onError: (_err, _threadId, context) => {
			context?.previous.forEach(([key, data]) => {
				queryClient.setQueryData(key, data)
			})
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["chat", "threads"] })
		},
	})
}

export function useArchiveChatThread() {
	return useMoveThreadMutation(
		(id) => Axios.patch(ChatThreadController.update.url(id), { folder: "archive" }),
		"archive"
	)
}

export function useTrashChatThread() {
	return useMoveThreadMutation(
		(id) => Axios.patch(ChatThreadController.update.url(id), { folder: "trash" }),
		"trash"
	)
}

export function useRestoreChatThread() {
	return useMoveThreadMutation(
		(threadId) => Axios.patch(ChatThreadController.update.url(threadId), { restore: true }),
		null
	)
}

export function useDeleteChatThreadPermanently() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (threadId: string) => Axios.delete(ChatThreadController.destroy.url(threadId)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chat", "threads"] })
		},
	})
}

export function useSendChat() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (payload: ChatComposePayload) => Axios.post(ChatMessageController.store.url(), payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chat", "threads"] })
		},
	})
}

export function useRetryChatMessage(threadId: string | null) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (messageId: string) => Axios.post(ChatMessageController.retry.url(messageId)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chat", "threads"] })

			if (threadId) {
				queryClient.invalidateQueries({ queryKey: ["chat", "thread", threadId] })
			}
		},
	})
}

function respondAction(mode: ChatComposeMode) {
	switch (mode) {
		case "reply":
			return ChatMessageController.reply
		case "reply-all":
			return ChatMessageController.replyAll
		case "forward":
			return ChatMessageController.forward
		default:
			throw new Error(`respondAction called with invalid mode: ${mode}`)
	}
}

export function useReplyChat(mode: Exclude<ChatComposeMode, "new">, parentMessageId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (payload: ChatComposePayload) =>
			Axios.post(respondAction(mode).url(parentMessageId), payload),
		onSuccess: (response) => {
			const threadId = (response.data?.data as { threadId?: string } | undefined)?.threadId

			queryClient.invalidateQueries({ queryKey: ["chat", "threads"] })

			if (threadId) {
				queryClient.invalidateQueries({ queryKey: ["chat", "thread", threadId] })
			}
		},
	})
}

export function useAddChatThreadLabel() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ threadId, labelId }: { threadId: string; labelId: string }) =>
			Axios.post(ChatThreadController.attachLabel.url(threadId), { labelId }),
		onSuccess: (_data, { threadId }) => {
			queryClient.invalidateQueries({ queryKey: ["chat", "thread", threadId] })
		},
	})
}

export function useRemoveChatThreadLabel() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ threadId, labelId }: { threadId: string; labelId: string }) =>
			Axios.delete(ChatThreadController.detachLabel.url([threadId, labelId])),
		onSuccess: (_data, { threadId }) => {
			queryClient.invalidateQueries({ queryKey: ["chat", "thread", threadId] })
		},
	})
}

export function useCreateChatLabel() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (payload: { name: string; color?: string }) =>
			Axios.post(ChatLabelController.store.url(), payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chat", "labels"] })
		},
	})
}

export function useDeleteChatLabel() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (labelId: string) => Axios.delete(ChatLabelController.destroy.url(labelId)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chat", "labels"] })
		},
	})
}
