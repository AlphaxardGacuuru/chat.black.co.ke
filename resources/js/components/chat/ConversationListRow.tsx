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
				"flex w-full items-center gap-2 rounded-lg border bg-card px-2 py-2 text-left shadow-sm transition-all hover:-translate-y-px hover:shadow-md md:gap-3 md:rounded-xl md:px-3 md:py-3",
				isSelected && "border-primary/50 bg-muted"
			)}>
			<Avatar className="size-14 shrink-0">
				<AvatarImage
					src={otherUser?.avatar ?? undefined}
					alt={otherUser?.name}
				/>
				<AvatarFallback>{initials(otherUser?.name)}</AvatarFallback>
			</Avatar>

			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<span className={cn("truncate", unreadCount > 0 && "font-semibold text-primary")}>
						{otherUser?.name ?? "Unknown"}
					</span>
					<span className="shrink-0 text-xs text-muted-foreground">
						{formatTime(lastMessageAt)}
					</span>
				</div>
				{otherUser?.email && (
					<span className="block truncate text-xs text-muted-foreground">
						{otherUser.email}
					</span>
				)}
				<div className="flex items-center justify-between gap-2">
					<span
						className={cn(
							"truncate text-sm",
							unreadCount > 0 ? "font-medium text-primary" : "text-muted-foreground"
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
