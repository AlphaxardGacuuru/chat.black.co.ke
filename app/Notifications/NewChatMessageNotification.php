<?php

namespace App\Notifications;

use App\Models\ChatMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NewChatMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(protected ChatMessage $message) {}

    /**
     * @return array<int, string>
     */
    public function via($notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        $conversationId = $this->message->conversation_id;

        return (new WebPushMessage)
            ->title($this->message->sender->name)
            ->icon($this->message->sender->avatar ?? '/favicon.ico')
            ->body($this->body())
            // Group notifications per conversation so a burst of messages
            // replaces the previous banner instead of stacking indefinitely,
            // while renotify still re-alerts the user for each one.
            ->tag('chat-conversation-' . $conversationId)
            ->renotify()
            ->data(['url' => "/chats/{$conversationId}/show"]);
    }

    protected function body(): string
    {
        if (filled($this->message->body)) {
            return Str::limit($this->message->body, 120);
        }

        $attachmentCount = $this->message->attachments->count();

        return $attachmentCount > 1
            ? "Sent {$attachmentCount} attachments"
            : 'Sent an attachment';
    }
}
