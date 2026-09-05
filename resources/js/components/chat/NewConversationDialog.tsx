import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import toast from "@/lib/toast"
import { useSearchChatUsers, useStartConversation } from "@/queries/chat"

type Props = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onStarted: (conversationId: string) => void
}

export default function NewConversationDialog({ open, onOpenChange, onStarted }: Props) {
	const [query, setQuery] = useState("")
	const { data: results, isLoading } = useSearchChatUsers(query)
	const startConversation = useStartConversation()

	function handlePick(userId: string) {
		startConversation.mutate(userId, {
			onSuccess: (conversation) => {
				setQuery("")
				onStarted(conversation.id)
			},
			onError: () => toast.error("Couldn't start the conversation"),
		})
	}

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New chat</DialogTitle>
				</DialogHeader>

				<Input
					autoFocus
					placeholder="Search people by name"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
				/>

				<div className="max-h-72 space-y-1 overflow-y-auto">
					{isLoading && (
						<div className="flex justify-center py-6">
							<Spinner className="size-5 text-muted-foreground" />
						</div>
					)}

					{!isLoading && query.trim() !== "" && (results?.length ?? 0) === 0 && (
						<p className="py-6 text-center text-sm text-muted-foreground">
							No one found
						</p>
					)}

					{results?.map((user) => (
						<button
							key={user.id}
							type="button"
							disabled={startConversation.isPending}
							onClick={() => handlePick(user.id)}
							className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted disabled:opacity-50">
							<Avatar className="size-9">
								<AvatarImage
									src={user.avatar ?? undefined}
									alt={user.name}
								/>
								<AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
							</Avatar>
							<span className="truncate">{user.name}</span>
						</button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
