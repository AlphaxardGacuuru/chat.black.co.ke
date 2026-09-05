<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversationId' => $this->conversation_id,
            'senderId' => $this->sender_id,
            'body' => $this->body,
            'attachments' => ChatMessageAttachmentResource::collection($this->whenLoaded('attachments')),
            'isRead' => (bool) ($this->is_read_by_recipient ?? false),
            'createdAt' => $this->created_at,
        ];
    }
}
