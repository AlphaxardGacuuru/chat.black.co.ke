import { useEffect, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import ChatEmptyState from "@/components/chat/ChatEmptyState"
import ConversationListRow from "@/components/chat/ConversationListRow"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import toast from "@/lib/toast"
import { useConversations, useRemoveConversation } from "@/queries/chat"

const UNDO_REMOVE_WINDOW_MS = 5000

type Props = {
	selectedId: string | null
	onSelect: (id: string) => void
}

export default function ConversationList({ selectedId, onSelect }: Props) {
	const { data: conversations, isLoading } = useConversations()
	const navigate = useNavigate()
	const removeConversation = useRemoveConversation()

	const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(new Set())
	const removeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

	useEffect(() => {
		const timers = removeTimersRef.current
		return () => {
			timers.forEach((timeoutId) => clearTimeout(timeoutId))
			timers.clear()
		}
	}, [])

	function cancelPendingRemove(conversationId: string) {
		const timeoutId = removeTimersRef.current.get(conversationId)
		if (timeoutId) {
			clearTimeout(timeoutId)
			removeTimersRef.current.delete(conversationId)
		}
		setPendingRemoveIds((previous) => {
			const next = new Set(previous)
			next.delete(conversationId)
			return next
		})
	}

	function handleRemoveRequest(conversationId: string) {
		if (pendingRemoveIds.has(conversationId)) {
			return
		}

		setPendingRemoveIds((previous) => new Set(previous).add(conversationId))

		const timeoutId = setTimeout(() => {
			removeTimersRef.current.delete(conversationId)
			removeConversation.mutate(conversationId, {
				onError: () => {
					toast.error("Couldn't remove the conversation")
					cancelPendingRemove(conversationId)
				},
			})
		}, UNDO_REMOVE_WINDOW_MS)

		removeTimersRef.current.set(conversationId, timeoutId)

		toast("Conversation removed, undo?", {
			duration: UNDO_REMOVE_WINDOW_MS,
			action: {
				label: "Undo",
				onClick: () => cancelPendingRemove(conversationId),
			},
		})
	}

	const visibleConversations = (conversations ?? []).filter(
		(conversation) => !pendingRemoveIds.has(conversation.id)
	)

	return (
		<div className="relative flex h-full flex-col">
			<div className="flex-1 space-y-1 overflow-y-auto p-1.5 md:space-y-2 md:p-3">
				{isLoading && (
					<>
						<Skeleton className="h-16 w-full rounded-xl" />
						<Skeleton className="h-16 w-full rounded-xl" />
						<Skeleton className="h-16 w-full rounded-xl" />
					</>
				)}

				{!isLoading && visibleConversations.length === 0 && (
					<ChatEmptyState variant="no-conversations" />
				)}

				{!isLoading &&
					visibleConversations.map((conversation) => (
						<ConversationListRow
							key={conversation.id}
							conversation={conversation}
							isSelected={conversation.id === selectedId}
							onSelect={() => onSelect(conversation.id)}
							onRemove={() => handleRemoveRequest(conversation.id)}
						/>
					))}
			</div>

			<Button
				size="icon"
				aria-label="New chat"
				title="New chat"
				className="fixed right-4 bottom-[calc(6rem+1rem+env(safe-area-inset-bottom))] z-50 size-14 rounded-full shadow-lg md:absolute md:right-6 md:bottom-6"
				onClick={() => navigate({ to: "/chats/new" })}>
				<Plus className="size-6" strokeWidth={1.5} />
			</Button>
		</div>
	)
}
