<?php

namespace App\Http\Services;

use App\Enums\ChatFolder;
use App\Enums\ChatStatus;
use App\Http\Services\Concerns\ResolvesChatThread;
use App\Jobs\SendChatMessageJob;
use App\Models\ChatAttachment;
use App\Models\ChatMessage;
use App\Models\ChatThread;
use App\Models\TemporaryUpload;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChatMessageService extends Service
{
    use ResolvesChatThread;

    public function __construct(protected ChatSanitizerService $sanitizer)
    {
        parent::__construct();
    }

    /**
     * Compose and queue a brand new message.
     */
    public function store(Request $request)
    {
        $user = User::findOrFail($this->id);

        $to = $this->normalizeAddresses($request->input('to', []));
        $cc = $this->normalizeAddresses($request->input('cc', []));
        $bcc = $this->normalizeAddresses($request->input('bcc', []));

        [$saved, $chatMessage] = $this->createOutboundMessage($user, [
            'to' => $to,
            'cc' => $cc,
            'bcc' => $bcc,
            'subject' => $request->input('subject'),
            'bodyHtml' => $request->input('bodyHtml'),
            'inReplyTo' => null,
            'references' => null,
            'participantEmail' => $to[0]['address'] ?? null,
        ], $request->input('temporaryUploadIds', []));

        return [$saved, 'Message Queued for Sending', $chatMessage];
    }

    /**
     * Reply, reply-all, or forward to an existing message.
     */
    public function respond(Request $request, string $messageId, string $mode)
    {
        $user = User::findOrFail($this->id);

        $parent = ChatMessage::where('user_id', $this->id)->findOrFail($messageId);

        $to = match ($mode) {
            'forward' => $this->normalizeAddresses($request->input('to', [])),
            'reply' => [$parent->from_address],
            'reply-all' => array_values(array_filter(array_merge(
                [$parent->from_address],
                $parent->to ?? [],
            ), fn($address) => ($address['address'] ?? null) && $address['address'] !== $user->email)),
            default => [],
        };

        $cc = $mode === 'reply-all' ? $this->normalizeAddresses($parent->cc ?? []) : $this->normalizeAddresses($request->input('cc', []));

        $subjectPrefix = $mode === 'forward' ? 'Fwd: ' : 'Re: ';
        $subject = preg_match('/^(re|fwd?|fw)\s*:/i', (string) $parent->subject)
            ? $parent->subject
            : $subjectPrefix . $parent->subject;

        $participantEmail = $mode === 'forward'
            ? ($to[0]['address'] ?? null)
            : ($parent->from_address['address'] ?? null);

        [$saved, $chatMessage] = $this->createOutboundMessage($user, [
            'to' => $to,
            'cc' => $cc,
            'bcc' => $this->normalizeAddresses($request->input('bcc', [])),
            'subject' => $subject,
            'bodyHtml' => $request->input('bodyHtml'),
            'inReplyTo' => $mode !== 'forward' ? $parent->message_id : null,
            'references' => $mode !== 'forward'
                ? trim(($parent->references ?? '') . ' ' . ($parent->message_id ?? ''))
                : null,
            'participantEmail' => $participantEmail,
            'threadId' => $mode !== 'forward' ? $parent->chat_thread_id : null,
        ], $request->input('temporaryUploadIds', []));

        return [$saved, 'Message Queued for Sending', $chatMessage];
    }

    /**
     * Reset a failed outbound message so it can be re-queued for sending.
     */
    public function retry(string $id): ChatMessage
    {
        $chatMessage = ChatMessage::where('user_id', $this->id)
            ->where('direction', 'outbound')
            ->where('status', ChatStatus::FAILED->value)
            ->findOrFail($id);

        $chatMessage->update([
            'status' => ChatStatus::QUEUED->value,
            'error_message' => null,
            'job_id' => null,
        ]);

        return $chatMessage;
    }

    protected function normalizeAddresses(array $addresses): array
    {
        return collect($addresses)
            ->map(function ($address) {
                if (is_string($address)) {
                    return ['address' => $address, 'name' => null];
                }

                return [
                    'address' => $address['address'] ?? null,
                    'name' => $address['name'] ?? null,
                ];
            })
            ->filter(fn($address) => filled($address['address']))
            ->values()
            ->all();
    }

    protected function createOutboundMessage(User $user, array $fields, array $temporaryUploadIds): array
    {
        $bodyHtml = $this->sanitizer->sanitize($fields['bodyHtml'] ?? null);
        $bodyText = trim(strip_tags((string) $bodyHtml));

        $thread = isset($fields['threadId']) && $fields['threadId']
            ? ChatThread::find($fields['threadId'])
            : null;

        if (! $thread) {
            $thread = $this->resolveThread(
                $user->id,
                $fields['subject'],
                $fields['inReplyTo'] ?? null,
                $fields['references'] ?? null,
                $fields['participantEmail'] ?? null,
            );
        }

        $chatMessage = new ChatMessage;
        $chatMessage->chat_thread_id = $thread->id;
        $chatMessage->user_id = $user->id;
        $chatMessage->direction = 'outbound';
        $chatMessage->folder = ChatFolder::SENT->value;
        $chatMessage->from_address = [
            'address' => $user->email,
            'name' => $user->name
        ];
        $chatMessage->to = $fields['to'] ?? [];
        $chatMessage->cc = $fields['cc'] ?? [];
        $chatMessage->bcc = $fields['bcc'] ?? [];
        $chatMessage->subject = $fields['subject'];
        $chatMessage->body_html = $bodyHtml;
        $chatMessage->body_text = $bodyText;
        $chatMessage->snippet = Str::limit($bodyText, 160);
        $chatMessage->in_reply_to = $fields['inReplyTo'] ?? null;
        $chatMessage->references = $fields['references'] ?? null;
        $chatMessage->status = ChatStatus::QUEUED->value;
        $chatMessage->is_read = true;
        $chatMessage->has_attachments = ! empty($temporaryUploadIds);

        $saved = $chatMessage->save();

        if (! $saved) {
            return [$saved, $chatMessage];
        }

        $this->attachTemporaryUploads($chatMessage, $temporaryUploadIds);

        $this->refreshThreadAggregates($thread);

        return [$saved, $chatMessage];
    }

    protected function attachTemporaryUploads(ChatMessage $chatMessage, array $temporaryUploadIds): void
    {
        $ids = collect($temporaryUploadIds)->filter()->unique()->values();

        if ($ids->isEmpty()) {
            return;
        }

        $temporaryUploads = TemporaryUpload::whereIn('id', $ids)->get();

        foreach ($temporaryUploads as $temporaryUpload) {
            $disk = $temporaryUpload->disk ?: 'public';
            $finalPath = "chat-attachments/{$chatMessage->id}/" . basename($temporaryUpload->path);

            Storage::disk($disk)->move($temporaryUpload->path, $finalPath);

            $chatAttachment = new ChatAttachment;
            $chatAttachment->chat_message_id = $chatMessage->id;
            $chatAttachment->disk = $disk;
            $chatAttachment->path = $finalPath;
            $chatAttachment->original_name = $temporaryUpload->original_name;
            $chatAttachment->mime_type = $temporaryUpload->mime_type;
            $chatAttachment->size = $temporaryUpload->size;
            $chatAttachment->save();
        }

        TemporaryUpload::whereIn('id', $temporaryUploads->pluck('id'))->delete();
    }
}
