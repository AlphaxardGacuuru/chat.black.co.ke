import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ChatConversation } from "@/types/chat"

function initials(name?: string | null): string {
	return (name?.trim() || "?").slice(0, 2).toUpperCase()
}

function formatTime(value: string | null): string {
	if (!value) {
		return ""
	}

	const date = new Date(value)
	const now = new Date()

	if (date.toDateString() === now.toDateString()) {
		return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
	}

	return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

type Props = {
	conversation: ChatConversation
	isSelected: boolean
	onSelect: () => void
}

export default function ConversationListRow({ conversation, isSelected, onSelect }: Props) {
	const { otherUser, lastMessage, unreadCount, lastMessageAt } = conversation

	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"flex w-full items-center gap-3 border-b px-3 py-3 text-left transition-colors hover:bg-muted/50",
				isSelected && "bg-muted"
			)}>
			<Avatar className="size-11 shrink-0">
				<AvatarImage
					src={otherUser?.avatar ?? undefined}
					alt={otherUser?.name}
				/>
				<AvatarFallback>{initials(otherUser?.name)}</AvatarFallback>
			</Avatar>

			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<span className={cn("truncate", unreadCount > 0 && "font-semibold")}>
						{otherUser?.name ?? "Unknown"}
					</span>
					<span className="shrink-0 text-xs text-muted-foreground">
						{formatTime(lastMessageAt)}
					</span>
				</div>
				<div className="flex items-center justify-between gap-2">
					<span
						className={cn(
							"truncate text-sm",
							unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
						)}>
						{lastMessage?.body || "No messages yet"}
					</span>
					{unreadCount > 0 && (
						<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</div>
			</div>
		</button>
	)
}
