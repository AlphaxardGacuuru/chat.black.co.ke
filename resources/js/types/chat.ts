export type ChatAddress = {
	address: string
	name?: string | null
}

export type ChatAttachment = {
	id: string
	filename: string | null
	mimeType: string | null
	size: number | null
	isInline: boolean
	downloadUrl: string
}

export type ChatLabel = {
	id: string
	name: string
	color: string | null
}

export type ChatMessageStatus = "queued" | "sent" | "failed"

export type ChatMessage = {
	id: string
	threadId: string
	direction: "inbound" | "outbound"
	folder: string
	from: ChatAddress | null
	to: ChatAddress[]
	cc: ChatAddress[]
	bcc: ChatAddress[]
	subject: string | null
	bodyHtml: string | null
	bodyText: string | null
	snippet: string | null
	status: ChatMessageStatus | null
	errorMessage: string | null
	isRead: boolean
	isStarred: boolean
	hasAttachments: boolean
	attachments: ChatAttachment[]
	labels: ChatLabel[]
	sentAt: string | null
	receivedAt: string | null
	createdAt: string
}

export type ChatThreadSummary = {
	id: string
	subject: string | null
	snippet: string | null
	from: ChatAddress | null
	hasUnread: boolean
	isStarred: boolean
	messageCount: number
	hasAttachments: boolean
	lastMessageAt: string | null
	status: ChatMessageStatus | null
	isRead: boolean
}

export type ChatThread = ChatThreadSummary & {
	messages: ChatMessage[]
}

export type ChatFolderKey = "inbox" | "starred" | "sent" | "archive" | "trash"

export type ChatComposeMode = "new" | "reply" | "reply-all" | "forward"

export type ChatComposePayload = {
	to?: string[]
	cc?: string[]
	bcc?: string[]
	subject: string
	bodyHtml: string
	temporaryUploadIds?: number[]
}
