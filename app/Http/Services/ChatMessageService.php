<?php

namespace App\Http\Services;

use App\Events\ChatMessageSent;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\ChatMessageAttachment;
use App\Models\TemporaryUpload;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ChatMessageService extends Service
{
    public function send(string $conversationId, ?string $body, array $temporaryUploadIds = []): array
    {
        $conversation = ChatConversation::forUser($this->id)->findOrFail($conversationId);

        if (blank($body) && empty($temporaryUploadIds)) {
            throw ValidationException::withMessages([
                'body' => ['A message needs text or an attachment.'],
            ]);
        }

        $message = new ChatMessage;
        $message->conversation_id = $conversation->id;
        $message->sender_id = $this->id;
        $message->body = $body;
        $saved = $message->save();

        if (! $saved) {
            return [false, 'Message Could Not Be Sent', null];
        }

        $this->attachTemporaryUploads($message, $temporaryUploadIds);

        $conversation->update(['last_message_at' => $message->created_at]);

        $message->load(['sender', 'attachments']);

        ChatMessageSent::dispatch($message);

        return [true, 'Message Sent', $message];
    }

    public function destroy(string $id): array
    {
        $message = ChatMessage::where('sender_id', $this->id)->findOrFail($id);
        $deleted = $message->delete();

        return [$deleted, 'Message Deleted'];
    }

    protected function attachTemporaryUploads(ChatMessage $message, array $temporaryUploadIds): void
    {
        $ids = collect($temporaryUploadIds)->filter()->unique()->values();

        if ($ids->isEmpty()) {
            return;
        }

        $temporaryUploads = TemporaryUpload::whereIn('id', $ids)->get();

        foreach ($temporaryUploads as $temporaryUpload) {
            $disk = $temporaryUpload->disk ?: 'public';
            $finalPath = "chat-attachments/{$message->id}/" . basename($temporaryUpload->path);

            Storage::disk($disk)->move($temporaryUpload->path, $finalPath);

            $attachment = new ChatMessageAttachment;
            $attachment->message_id = $message->id;
            $attachment->disk = $disk;
            $attachment->path = $finalPath;
            $attachment->original_name = $temporaryUpload->original_name;
            $attachment->mime_type = $temporaryUpload->mime_type;
            $attachment->size = $temporaryUpload->size;
            $attachment->save();
        }

        TemporaryUpload::whereIn('id', $temporaryUploads->pluck('id'))->delete();
    }
}
