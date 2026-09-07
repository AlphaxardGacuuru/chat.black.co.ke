import { useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import ConversationList from "@/components/chat/ConversationList"
import { Button } from "@/components/ui/button"
import { Head } from "@/lib/spa"

export default function ChatArchived() {
	const navigate = useNavigate()

	return (
		<>
			<Head title="Archived chats" />

			<div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
				<div className="flex items-center gap-3 border-b p-3">
					<Button
						variant="ghost"
						onClick={() => navigate({ to: "/chats" })}>
						<ArrowLeft className="size-5" />
						Back to chats
					</Button>
				</div>

				<ConversationList
					archived
					selectedId={null}
					onSelect={(id) => navigate({ to: "/chats/$id/show", params: { id } })}
				/>
			</div>
		</>
	)
}
