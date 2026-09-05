import { useNavigate } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import ChatEmptyState from "@/components/chat/ChatEmptyState"
import ConversationListRow from "@/components/chat/ConversationListRow"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useConversations } from "@/queries/chat"

type Props = {
	selectedId: string | null
	onSelect: (id: string) => void
}

export default function ConversationList({ selectedId, onSelect }: Props) {
	const { data: conversations, isLoading } = useConversations()
	const navigate = useNavigate()

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
				className="fixed right-4 bottom-[calc(6rem+1rem+env(safe-area-inset-bottom))] z-50 size-14 rounded-full shadow-lg md:absolute md:right-6 md:bottom-6"
				onClick={() => navigate({ to: "/chats/new" })}>
				<Plus className="size-6" strokeWidth={1.5} />
			</Button>
		</div>
	)
}
