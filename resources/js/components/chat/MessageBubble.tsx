import ChatAttachmentChip from "@/components/chat/ChatAttachmentChip"
import ChatStatusIcon from "@/components/chat/ChatStatusIcon"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/types/chat"

function formatTime(value: string): string {
	return new Date(value).toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	})
}

type Props = {
	message: ChatMessage
	isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: Props) {
	return (
		<div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
			<div
				className={cn(
					"max-w-[75%] space-y-2 rounded-2xl px-3 py-2 text-sm shadow-sm",
					isOwn
						? "rounded-br-sm bg-primary text-primary-foreground"
						: "rounded-bl-sm bg-muted text-foreground"
				)}>
				{message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}

				{message.attachments.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{message.attachments.map((attachment) => (
							<ChatAttachmentChip
								key={attachment.id}
								attachment={attachment}
							/>
						))}
					</div>
				)}

				<div
					className={cn(
						"flex items-center justify-end gap-1 text-[11px]",
						isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
					)}>
					<span>{formatTime(message.createdAt)}</span>
					{isOwn && (
						<ChatStatusIcon
							isRead={message.isRead}
							className="size-3"
						/>
					)}
				</div>
			</div>
		</div>
	)
}
