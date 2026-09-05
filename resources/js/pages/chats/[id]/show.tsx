import { useNavigate } from "@tanstack/react-router"
import ConversationView from "@/components/chat/ConversationView"
import { Head } from "@/lib/spa"

export default function ChatShow({ id }: { id: string }) {
	const navigate = useNavigate()

	return (
		<>
			<Head title="Chat" />

			<div className="flex h-[calc(100vh-4rem)] flex-col rounded-lg overflow-hidden">
				<ConversationView
					conversationId={id}
					variant="page"
					onBack={() => navigate({ to: "/chats" })}
				/>
			</div>
		</>
	)
}
