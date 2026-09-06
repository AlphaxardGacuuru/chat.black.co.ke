import { useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import toast from "@/lib/toast"
import { useConversations, useForwardMessage } from "@/queries/chat"
import type { ChatMessage } from "@/types/chat"

function initials(name?: string | null): string {
	return (name?.trim() || "?").slice(0, 2).toUpperCase()
}

type Props = {
	message: ChatMessage | null
	excludeConversationId: string
	onOpenChange: (open: boolean) => void
}

export default function ForwardMessageDialog({
	message,
	excludeConversationId,
	onOpenChange,
}: Props) {
	const [search, setSearch] = useState("")
	const { data: conversations } = useConversations()
	const forwardMessage = useForwardMessage()

	const results = useMemo(() => {
		const query = search.trim().toLowerCase()

		return (conversations ?? [])
			.filter((conversation) => conversation.id !== excludeConversationId)
			.filter((conversation) =>
				query ? (conversation.otherUser?.name ?? "").toLowerCase().includes(query) : true
			)
	}, [conversations, excludeConversationId, search])

	function handleSelect(conversationId: string) {
		if (!message || forwardMessage.isPending) {
			return
		}

		forwardMessage.mutate(
			{ messageId: message.id, conversationId },
			{
				onSuccess: () => {
					toast.success("Message forwarded")
					onOpenChange(false)
				},
				onError: () => toast.error("Couldn't forward the message"),
			}
		)
	}

	return (
		<Dialog
			open={message !== null}
			onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Forward message</DialogTitle>
				</DialogHeader>

				<Input
					label="Search conversations"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					autoFocus
				/>

				<div className="max-h-72 space-y-1 overflow-y-auto">
					{results.length === 0 && (
						<p className="py-6 text-center text-sm text-muted-foreground">
							No conversations found
						</p>
					)}

					{results.map((conversation) => (
						<button
							key={conversation.id}
							type="button"
							disabled={forwardMessage.isPending}
							onClick={() => handleSelect(conversation.id)}
							className={cn(
								"flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
							)}>
							<Avatar className="size-9">
								<AvatarImage
									src={conversation.otherUser?.avatar ?? undefined}
									alt={conversation.otherUser?.name}
								/>
								<AvatarFallback>{initials(conversation.otherUser?.name)}</AvatarFallback>
							</Avatar>
							<span className="truncate text-sm font-medium">
								{conversation.otherUser?.name ?? "Unknown"}
							</span>
						</button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
