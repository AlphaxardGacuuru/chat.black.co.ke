import ChatShell from "@/components/chat/ChatShell"
import { Head } from "@/lib/spa"
import type { ChatFolderKey } from "@/types/chat"

type Props = {
	folder: ChatFolderKey
	labelId?: string
}

export default function ChatFolderPage({ folder, labelId }: Props) {
	return (
		<>
			<Head title="Chat" />
			<ChatShell
				folder={folder}
				labelId={labelId}
			/>
		</>
	)
}
