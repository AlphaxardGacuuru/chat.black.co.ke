import { Pencil } from "lucide-react"
import ChatEmptyState from "@/components/chat/ChatEmptyState"
import ChatSearchBar from "@/components/chat/ChatSearchBar"
import ChatThreadListRow from "@/components/chat/ChatThreadListRow"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useChatThreads } from "@/queries/chat"
import type { ChatThreadFilters } from "@/queries/chat"

type Props = {
	filters: ChatThreadFilters
	onFiltersChange: (filters: ChatThreadFilters) => void
	selectedThreadId: string | null
	onSelectThread: (threadId: string) => void
	onCompose: () => void
}

export default function ChatThreadList({
	filters,
	onFiltersChange,
	selectedThreadId,
	onSelectThread,
	onCompose,
}: Props) {
	const { data, isLoading } = useChatThreads(filters)

	const threads = data?.data ?? []
	const meta = data?.meta

	return (
		<div className="relative flex h-full flex-col">
			<ChatSearchBar
				value={filters.q ?? ""}
				onChange={(q) => onFiltersChange({ ...filters, q, page: 1 })}
			/>

			<div className="flex-1 overflow-y-auto lg:p-3">
				{isLoading && (
					<div className="space-y-3">
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
					</div>
				)}

				{!isLoading && threads.length === 0 && (
					<ChatEmptyState
						variant={filters.q ? "search-no-results" : "no-threads"}
					/>
				)}

				{!isLoading && threads.length > 0 && (
					<div className="space-y-2">
						{threads.map((thread) => (
							<ChatThreadListRow
								key={thread.id}
								thread={thread}
								folder={filters.folder}
								isSelected={thread.id === selectedThreadId}
								onSelect={() => onSelectThread(thread.id)}
							/>
						))}
					</div>
				)}
			</div>

			{meta && meta.last_page > 1 && (
				<div className="flex items-center justify-between border-t p-2">
					<Button
						variant="outline"
						size="sm"
						disabled={meta.current_page <= 1}
						onClick={() =>
							onFiltersChange({ ...filters, page: meta.current_page - 1 })
						}>
						Previous
					</Button>
					<span className="text-xs text-muted-foreground">
						Page {meta.current_page} of {meta.last_page}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={meta.current_page >= meta.last_page}
						onClick={() =>
							onFiltersChange({ ...filters, page: meta.current_page + 1 })
						}>
						Next
					</Button>
				</div>
			)}

			<Button
				size="icon"
				aria-label="Compose"
				title="Compose"
				className="fixed right-6 bottom-6 z-50 size-14 rounded-full shadow-lg"
				onClick={onCompose}>
				<Pencil className="size-6" strokeWidth={1.5} />
			</Button>
		</div>
	)
}
