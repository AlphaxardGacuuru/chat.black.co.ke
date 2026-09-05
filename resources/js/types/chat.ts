export type ChatUser = {
	id: string
	name: string
	email: string
	avatar: string | null
	lastSeenAt: string | null
}

export type ChatAttachment = {
	id: string
	filename: string | null
	mimeType: string | null
	size: number | null
	downloadUrl: string
}

export type ChatMessage = {
	id: string
	conversationId: string
	senderId: string
	body: string | null
	attachments: ChatAttachment[]
	isRead: boolean
	createdAt: string
}

export type ChatConversationLastMessage = {
	body: string | null
	senderId: string
	createdAt: string
}

export type ChatConversation = {
	id: string
	otherUser: ChatUser | null
	lastMessage: ChatConversationLastMessage | null
	unreadCount: number
	lastMessageAt: string | null
}
