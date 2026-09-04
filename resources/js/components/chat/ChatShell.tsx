import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import ChatComposePane from "@/components/chat/ChatComposePane"
import ChatEmptyState from "@/components/chat/ChatEmptyState"
import ChatThreadList from "@/components/chat/ChatThreadList"
import ChatThreadView from "@/components/chat/ChatThreadView"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ChatThreadFilters } from "@/queries/chat"
import type { ChatFolderKey } from "@/types/chat"

type ChatPane =
	| { type: "none" }
	| { type: "thread"; id: string }
	| { type: "compose" }

type Props = {
	folder: ChatFolderKey
	labelId?: string
	initialPane?: ChatPane
	onComposeSent?: (result: { threadId?: string }) => void
}

export default function ChatShell({
	folder,
	labelId,
	initialPane,
	onComposeSent,
}: Props) {
	const isMobile = useIsMobile()
	const navigate = useNavigate()

	const [filters, setFilters] = useState<ChatThreadFilters>({
		folder,
		label: labelId,
		page: 1,
		q: "",
	})
	const [pane, setPane] = useState<ChatPane>(initialPane ?? { type: "none" })

	function handleSelectThread(threadId: string) {
		if (isMobile) {
			navigate({ to: "/chat/$id/show", params: { id: threadId } })
		} else {
			setPane({ type: "thread", id: threadId })
		}
	}

	function openCompose() {
		if (isMobile) {
			navigate({ to: "/chat/compose" })
		} else {
			setPane({ type: "compose" })
		}
	}

	function closePane() {
		setPane({ type: "none" })
	}

	if (isMobile) {
		return (
			<div className="flex h-[calc(100vh-4rem)] flex-col">
				<ChatThreadList
					filters={filters}
					onFiltersChange={setFilters}
					selectedThreadId={null}
					onSelectThread={handleSelectThread}
					onCompose={openCompose}
				/>
			</div>
		)
	}

	return (
		<div className="flex h-[calc(100vh-6rem)] gap-2">
			<section className="w-1/4 shrink-0 overflow-hidden rounded-lg border bg-card shadow-sm">
				<ChatThreadList
					filters={filters}
					onFiltersChange={setFilters}
					selectedThreadId={pane.type === "thread" ? pane.id : null}
					onSelectThread={handleSelectThread}
					onCompose={openCompose}
				/>
			</section>

			{pane.type === "thread" && (
				<section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
					<ChatThreadView
						threadId={pane.id}
						variant="pane"
						onClose={closePane}
					/>
				</section>
			)}

			{pane.type === "compose" && (
				<section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
					<ChatComposePane
						variant="pane"
						onClose={closePane}
						onSent={onComposeSent ?? closePane}
					/>
				</section>
			)}

			{pane.type === "none" && (
				<section className="hidden min-w-0 flex-1 overflow-hidden rounded-lg border bg-card shadow-sm lg:flex">
					<ChatEmptyState variant="no-selection" />
				</section>
			)}
		</div>
	)
}
