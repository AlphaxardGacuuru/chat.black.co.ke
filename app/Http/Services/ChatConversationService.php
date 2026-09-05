<?php

namespace App\Http\Services;

use App\Events\ChatConversationRead;
use App\Models\ChatConversation;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ChatConversationService extends Service
{
    public function index(): array
    {
        $this->touchLastSeen();

        $conversations = ChatConversation::forUser($this->id)
            ->with(['participants', 'messages' => fn ($query) => $query->latest()->limit(1)])
            ->orderByDesc('last_message_at')
            ->get();

        return [true, $conversations->count() . ' Conversations Retrieved', $conversations];
    }

    public function startWith(string $otherUserId): array
    {
        if ($otherUserId === $this->id) {
            return [false, 'You Cannot Start A Conversation With Yourself', null];
        }

        $existing = ChatConversation::forUser($this->id)
            ->forUser($otherUserId)
            ->where('type', 'direct')
            ->first();

        if ($existing) {
            return [true, 'Conversation Already Exists', $existing->load('participants')];
        }

        $conversation = DB::transaction(function () use ($otherUserId) {
            $conversation = ChatConversation::create(['type' => 'direct']);
            $conversation->participants()->attach([$this->id, $otherUserId]);

            return $conversation;
        });

        return [true, 'Conversation Started', $conversation->load('participants')];
    }

    public function show(string $id, int $page = 1): array
    {
        $this->touchLastSeen();

        $conversation = ChatConversation::forUser($this->id)->with('participants')->findOrFail($id);

        // "Read by recipient" is a property of each message relative to its
        // own sender, not to whoever is currently viewing the conversation —
        // in a back-and-forth thread the viewer is the recipient for half
        // the messages and the sender for the other half.
        $lastReadAtByUserId = $conversation->participants->mapWithKeys(
            fn ($participant) => [$participant->id => $participant->pivot?->last_read_at]
        );

        $messages = $conversation->messages()
            ->with(['sender', 'attachments'])
            ->orderByDesc('created_at')
            ->paginate(30, ['*'], 'page', $page);

        $messages->getCollection()->each(function ($message) use ($conversation, $lastReadAtByUserId) {
            $recipient = $conversation->participants->firstWhere('id', '!=', $message->sender_id);
            $recipientLastReadAt = $recipient ? $lastReadAtByUserId->get($recipient->id) : null;

            $message->is_read_by_recipient = $recipientLastReadAt !== null
                && $recipientLastReadAt->gte($message->created_at);
        });

        return [true, 'Conversation Retrieved', $conversation, $messages];
    }

    public function markRead(string $id): array
    {
        $conversation = ChatConversation::forUser($this->id)->findOrFail($id);

        $conversation->participants()->updateExistingPivot($this->id, [
            'last_read_at' => now(),
        ]);

        ChatConversationRead::dispatch($conversation, $this->id);

        return [true, 'Conversation Marked Read'];
    }

    protected function touchLastSeen(): void
    {
        User::whereKey($this->id)
            ->where(function ($query) {
                $query->whereNull('last_seen_at')->orWhere('last_seen_at', '<', now()->subMinute());
            })
            ->update(['last_seen_at' => now()]);
    }
}
