import { useEffect, useRef, useState } from "react"
import { useEcho, usePresenceChannel } from "@laravel/echo-react"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import MessageBubble from "@/components/chat/MessageBubble"
import MessageComposer from "@/components/chat/MessageComposer"
import TypingIndicator from "@/components/chat/TypingIndicator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useApp } from "@/contexts/AppContext"
import { useConversation, useMarkConversationRead } from "@/queries/chat"
import type { ChatMessage } from "@/types/chat"

const TYPING_WHISPER_THROTTLE_MS = 2000
const TYPING_IDLE_TIMEOUT_MS = 3000

function initials(name?: string | null): string {
	return (name?.trim() || "?").slice(0, 2).toUpperCase()
}

function formatLastSeen(value: string): string {
	const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000)

	if (minutes < 1) {
		return "just now"
	}
	if (minutes < 60) {
		return `${minutes}m ago`
	}

	const hours = Math.floor(minutes / 60)
	if (hours < 24) {
		return `${hours}h ago`
	}

	return `${Math.floor(hours / 24)}d ago`
}

type PresenceMember = { id: string; name: string; avatar: string | null }

type Props = {
	conversationId: string
	variant: "pane" | "page"
	onBack?: () => void
}

export default function ConversationView({ conversationId, variant, onBack }: Props) {
	const { auth } = useApp()
	const queryClient = useQueryClient()
	const { data, isLoading } = useConversation(conversationId)
	const markRead = useMarkConversationRead()

	const [isOtherTyping, setIsOtherTyping] = useState(false)
	const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
	const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastWhisperAtRef = useRef(0)

	const channelName = `chat-conversation.${conversationId}`
	const myId = auth ? String(auth.id) : null

	const { channel } = usePresenceChannel(channelName)

	useEcho(
		channelName,
		"ChatMessageSent",
		(event: { message: ChatMessage }) => {
			queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
			queryClient.invalidateQueries({ queryKey: ["chat", "conversation", conversationId] })

			if (event.message.senderId !== myId) {
				markRead.mutate(conversationId)
			}
		},
		[conversationId],
		"presence"
	)

	useEcho(
		channelName,
		"ChatConversationRead",
		() => {
			queryClient.invalidateQueries({ queryKey: ["chat", "conversation", conversationId] })
		},
		[conversationId],
		"presence"
	)

	useEffect(() => {
		markRead.mutate(conversationId)
	}, [conversationId])

	useEffect(() => {
		const presenceChannel = channel()

		if (!presenceChannel) {
			return
		}

		presenceChannel
			.here((members: PresenceMember[]) => {
				setOnlineUserIds(new Set(members.map((member) => member.id)))
			})
			.joining((member: PresenceMember) => {
				setOnlineUserIds((previous) => new Set(previous).add(member.id))
			})
			.leaving((member: PresenceMember) => {
				setOnlineUserIds((previous) => {
					const next = new Set(previous)
					next.delete(member.id)
					return next
				})
			})
			.listenForWhisper("typing", (payload: { userId: string }) => {
				if (payload.userId === myId) {
					return
				}

				setIsOtherTyping(true)

				if (typingTimeoutRef.current) {
					clearTimeout(typingTimeoutRef.current)
				}
				typingTimeoutRef.current = setTimeout(
					() => setIsOtherTyping(false),
					TYPING_IDLE_TIMEOUT_MS
				)
			})

		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current)
			}
		}
	}, [conversationId, myId, channel])

	function sendTypingWhisper() {
		const now = Date.now()
		if (now - lastWhisperAtRef.current < TYPING_WHISPER_THROTTLE_MS) {
			return
		}
		lastWhisperAtRef.current = now
		channel()?.whisper("typing", { userId: myId })
	}

	if (isLoading || !data) {
		return (
			<div className="flex-1 space-y-3 p-4">
				<Skeleton className="h-6 w-2/3" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
		)
	}

	const { conversation, messages } = data
	const otherUser = conversation.otherUser
	const isOnline = otherUser ? onlineUserIds.has(otherUser.id) : false

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="flex items-center gap-2 border-b p-3">
				{variant === "page" && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onBack}>
						<ArrowLeft className="size-4" />
					</Button>
				)}

				<Avatar className="size-9">
					<AvatarImage
						src={otherUser?.avatar ?? undefined}
						alt={otherUser?.name}
					/>
					<AvatarFallback>{initials(otherUser?.name)}</AvatarFallback>
				</Avatar>

				<div className="min-w-0 flex-1">
					<p className="truncate font-medium">{otherUser?.name ?? "Unknown"}</p>
					<p className="truncate text-xs text-muted-foreground">
						{isOtherTyping
							? "typing…"
							: isOnline
								? "Online"
								: otherUser?.lastSeenAt
									? `Last seen ${formatLastSeen(otherUser.lastSeenAt)}`
									: ""}
					</p>
				</div>
			</div>

			<div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
				{messages.map((message) => (
					<MessageBubble
						key={message.id}
						message={message}
						isOwn={message.senderId === myId}
					/>
				))}
			</div>

			{isOtherTyping && otherUser && <TypingIndicator name={otherUser.name} />}

			<MessageComposer
				conversationId={conversationId}
				onTyping={sendTypingWhisper}
			/>
		</div>
	)
}
