import { useNavigate } from "@tanstack/react-router"
import ChatThreadView from "@/components/chat/ChatThreadView"
import { Head } from "@/lib/spa"

export default function ChatShow({ id }: { id: string }) {
	const navigate = useNavigate()

	return (
		<>
			<Head title="Chat" />

			<div className="flex h-[calc(100vh-4rem)] flex-col border rounded-lg overflow-hidden">
				<ChatThreadView
					threadId={id}
					variant="page"
					onBack={() => navigate({ to: "/chat" })}
				/>
			</div>
		</>
	)
}
