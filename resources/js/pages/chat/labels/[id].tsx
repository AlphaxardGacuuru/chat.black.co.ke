import ChatFolderPage from "@/components/chat/ChatFolderPage"

export default function ChatLabel({ id }: { id: string }) {
	return (
		<ChatFolderPage
			folder="inbox"
			labelId={id}
		/>
	)
}
