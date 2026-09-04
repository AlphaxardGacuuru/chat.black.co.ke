import { useNavigate } from "@tanstack/react-router"
import ChatShell from "@/components/chat/ChatShell"
import ChatThreadView from "@/components/chat/ChatThreadView"
import { useIsMobile } from "@/hooks/use-mobile"
import { Head } from "@/lib/spa"

export default function ChatSentThread({ id }: { id: string }) {
	const isMobile = useIsMobile()
	const navigate = useNavigate()

	if (isMobile) {
		return (
			<>
				<Head title="Sent chat" />
				<div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-lg border">
					<ChatThreadView
						threadId={id}
						variant="page"
						onBack={() => navigate({ to: "/chat/sent" })}
					/>
				</div>
			</>
		)
	}

	return (
		<>
			<Head title="Sent chat" />
			<ChatShell
				folder="sent"
				initialPane={{ type: "thread", id }}
			/>
		</>
	)
}
