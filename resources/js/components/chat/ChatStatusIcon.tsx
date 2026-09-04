import { Check, Clock } from "lucide-react"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { ChatMessageStatus } from "@/types/chat"

type Props = {
	status: ChatMessageStatus | null
	className?: string
}

function Ticks({ count, className }: { count: number; className?: string }) {
	return (
		<span className="flex items-center gap-0.5">
			{Array.from({ length: count }).map((_, index) => (
				<Check
					key={index}
					className={cn(index > 0 && "-ml-2", className)}
				/>
			))}
		</span>
	)
}

/**
 * Statuses track a simple outbound send lifecycle: queued -> sent, with
 * failed as the terminal error state.
 */
export default function ChatStatusIcon({ status, className }: Props) {
	if (!status) {
		return null
	}

	const size = cn("size-3.5", className)
	let label: string
	let icon: ReactNode

	switch (status) {
		case "queued":
			label = "Queued"
			icon = <Clock className={cn(size, "text-muted-foreground")} />
			break

		case "sent":
			label = "Sent"
			icon = (
				<Ticks
					count={1}
					className={cn(size, "text-muted-foreground")}
				/>
			)
			break

		case "failed":
			label = "Failed"
			icon = (
				<Ticks
					count={1}
					className={cn(size, "text-destructive")}
				/>
			)
			break

		default:
			return null
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span aria-label={label}>{icon}</span>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	)
}
