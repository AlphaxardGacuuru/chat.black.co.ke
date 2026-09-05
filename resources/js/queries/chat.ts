import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Axios from "@/lib/axios"
import type { ChatConversation, ChatMessage } from "@/types/chat"

type ConversationShowResponse = {
	data: {
		conversation: ChatConversation
		messages: ChatMessage[]
		meta: { currentPage: number; lastPage: number; total: number }
	}
}

export function useConversations() {
	return useQuery({
		queryKey: ["chat", "conversations"],
		queryFn: () =>
			Axios.get<{ data: ChatConversation[] }>("api/chat/conversations").then(
				(res) => res.data.data
			),
	})
}

export function useConversation(id: string | null, page = 1) {
	return useQuery({
		queryKey: ["chat", "conversation", id, page],
		queryFn: () =>
			Axios.get<ConversationShowResponse>(`api/chat/conversations/${id}`, {
				params: { page },
			}).then((res) => res.data.data),
		enabled: !!id,
	})
}

export function useStartConversation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (userId: string) =>
			Axios.post<{ data: ChatConversation }>("api/chat/conversations", { userId }).then(
				(res) => res.data.data
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
		},
	})
}

export function useSendMessage(conversationId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (payload: { body?: string; temporaryUploadIds?: number[] }) =>
			Axios.post(`api/chat/conversations/${conversationId}/messages`, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
			queryClient.invalidateQueries({
				queryKey: ["chat", "conversation", conversationId],
			})
		},
	})
}

export function useMarkConversationRead() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (conversationId: string) =>
			Axios.post(`api/chat/conversations/${conversationId}/read`),
		onSuccess: (_data, conversationId) => {
			queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
			queryClient.invalidateQueries({
				queryKey: ["chat", "conversation", conversationId],
			})
		},
	})
}

export function useDeleteMessage(conversationId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (messageId: string) => Axios.delete(`api/chat/messages/${messageId}`),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["chat", "conversation", conversationId],
			})
		},
	})
}

export type ChatUserSearchResult = {
	id: string
	name: string
	email: string
	avatar: string | null
}

export function useChatUsers(query: string) {
	return useQuery({
		queryKey: ["chat", "user-search", query],
		queryFn: () =>
			Axios.get<{ data: ChatUserSearchResult[] }>("api/users", {
				params: { name: query, per_page: 20, excludeSelf: true },
			}).then((res) => res.data.data),
	})
}
