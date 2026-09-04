import { useNavigate } from "@tanstack/react-router"
import ChatComposePane from "@/components/chat/ChatComposePane"
import ChatShell from "@/components/chat/ChatShell"
import { useIsMobile } from "@/hooks/use-mobile"
import { Head } from "@/lib/spa"

export default function ChatCompose() {
	const isMobile = useIsMobile()
	const navigate = useNavigate()

	if (isMobile) {
		return (
			<>
				<Head title="New message" />

				<div className="flex h-[calc(100vh-4rem)] flex-col border rounded-lg overflow-hidden">
					<ChatComposePane
						variant="page"
						onBack={() => navigate({ to: "/chat" })}
						onSent={({ threadId }) => {
							if (threadId) {
								navigate({ to: "/chat/sent/$id", params: { id: threadId } })
								return
							}

							navigate({ to: "/chat/sent" })
						}}
					/>
				</div>
			</>
		)
	}

	return (
		<>
			<Head title="New message" />
			<ChatShell
				folder="inbox"
				initialPane={{ type: "compose" }}
				onComposeSent={({ threadId }) => {
					if (threadId) {
						navigate({ to: "/chat/sent/$id", params: { id: threadId } })
						return
					}

					navigate({ to: "/chat/sent" })
				}}
			/>
		</>
	)
}
