import { useState } from "react"
import { Plus } from "lucide-react"
import ChatEmptyState from "@/components/chat/ChatEmptyState"
import ConversationListRow from "@/components/chat/ConversationListRow"
import NewConversationDialog from "@/components/chat/NewConversationDialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useConversations } from "@/queries/chat"

type Props = {
	selectedId: string | null
	onSelect: (id: string) => void
}

export default function ConversationList({ selectedId, onSelect }: Props) {
	const { data: conversations, isLoading } = useConversations()
	const [showNewChat, setShowNewChat] = useState(false)

	return (
		<div className="relative flex h-full flex-col">
			<div className="border-b p-3">
				<h2 className="text-lg font-semibold">Chats</h2>
			</div>

			<div className="flex-1 overflow-y-auto">
				{isLoading && (
					<div className="space-y-2 p-3">
						<Skeleton className="h-14 w-full" />
						<Skeleton className="h-14 w-full" />
						<Skeleton className="h-14 w-full" />
					</div>
				)}

				{!isLoading && (conversations?.length ?? 0) === 0 && (
					<ChatEmptyState variant="no-conversations" />
				)}

				{!isLoading &&
					conversations?.map((conversation) => (
						<ConversationListRow
							key={conversation.id}
							conversation={conversation}
							isSelected={conversation.id === selectedId}
							onSelect={() => onSelect(conversation.id)}
						/>
					))}
			</div>

			<Button
				size="icon"
				aria-label="New chat"
				title="New chat"
				className="absolute right-6 bottom-6 z-50 size-14 rounded-full shadow-lg"
				onClick={() => setShowNewChat(true)}>
				<Plus className="size-6" strokeWidth={1.5} />
			</Button>

			<NewConversationDialog
				open={showNewChat}
				onOpenChange={setShowNewChat}
				onStarted={(conversationId) => {
					setShowNewChat(false)
					onSelect(conversationId)
				}}
			/>
		</div>
	)
}
