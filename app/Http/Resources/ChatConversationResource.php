<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $me = $request->user();
        $otherParticipant = $this->participants->firstWhere('id', '!=', $me->id);
        $myPivot = $this->participants->firstWhere('id', $me->id)?->pivot;

        $lastMessage = $this->relationLoaded('messages')
            ? $this->messages->first()
            : $this->messages()->latest()->first();

        $unreadCount = $this->messages()
            ->where('sender_id', '!=', $me->id)
            ->when($myPivot?->last_read_at, fn ($query, $lastReadAt) => $query->where('created_at', '>', $lastReadAt))
            ->count();

        return [
            'id' => $this->id,
            'otherUser' => $otherParticipant ? [
                'id' => $otherParticipant->id,
                'name' => $otherParticipant->name,
                'email' => $otherParticipant->email,
                'avatar' => $otherParticipant->avatar,
                'lastSeenAt' => $otherParticipant->last_seen_at,
            ] : null,
            'lastMessage' => $lastMessage ? [
                'body' => $lastMessage->body,
                'senderId' => $lastMessage->sender_id,
                'createdAt' => $lastMessage->created_at,
            ] : null,
            'unreadCount' => $unreadCount,
            'lastMessageAt' => $this->last_message_at,
        ];
    }
}
