import { Forward, Reply, ReplyAll } from "lucide-react"
import { useState } from "react"
import ChatComposeForm from "@/components/chat/ChatComposeForm"
import { Button } from "@/components/ui/button"
import type { ChatMessage } from "@/types/chat"

type Props = {
	parentMessage: ChatMessage
	currentUserEmail?: string
	onSent: () => void
}

export default function ChatComposeInline({
	parentMessage,
	currentUserEmail,
	onSent,
}: Props) {
	const [activeMode, setActiveMode] = useState<
		"reply" | "reply-all" | "forward" | null
	>(null)

	if (!activeMode) {
		return (
			<div className="flex items-center justify-end gap-2 border-t pt-3">
				<Button
					variant="outline"
					onClick={() => setActiveMode("reply")}>
					<Reply className="size-4" />
					Reply
				</Button>
				<Button
					variant="outline"
					onClick={() => setActiveMode("reply-all")}>
					<ReplyAll className="size-4" />
					Reply All
				</Button>
				<Button
					variant="outline"
					onClick={() => setActiveMode("forward")}>
					<Forward className="size-4" />
					Forward
				</Button>
			</div>
		)
	}

	const initialCc =
		activeMode === "reply-all"
			? (parentMessage.cc ?? [])
					.map((address) => address.address)
					.filter((address) => address !== currentUserEmail)
			: []

	return (
		<div className="border-t pt-3">
			<ChatComposeForm
				mode={activeMode}
				parentMessageId={parentMessage.id}
				initialCc={initialCc}
				initialSubject={parentMessage.subject ?? ""}
				onSent={() => {
					setActiveMode(null)
					onSent()
				}}
				onCancel={() => setActiveMode(null)}
			/>
		</div>
	)
}
