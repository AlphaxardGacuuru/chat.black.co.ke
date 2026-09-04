<?php

namespace App\Jobs;

use App\Enums\ChatStatus;
use App\Mail\ComposedMail;
use App\Models\ChatMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendChatMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public string $chatMessageId)
    {
        $this->onQueue('chat');
    }

    public function handle(): void
    {
        $jobId = $this->currentJobId();

        $claimed = DB::transaction(function () use ($jobId) {
            $message = ChatMessage::where('id', $this->chatMessageId)
                ->lockForUpdate()
                ->first();

            if (! $message || $message->status === ChatStatus::SENT->value) {
                return false;
            }

            if ($message->job_id !== null && $message->job_id !== $jobId) {
                // Another job instance (a stale Horizon retry, a concurrent
                // dispatch, etc.) already claimed this message.
                return false;
            }

            $message->forceFill(['job_id' => $jobId])->save();

            return true;
        });

        if (! $claimed) {
            return;
        }

        $chatMessage = ChatMessage::with('attachments')->find($this->chatMessageId);

        if (! $chatMessage || $chatMessage->status === ChatStatus::SENT->value) {
            return;
        }

        $to = collect($chatMessage->to ?? [])->pluck('address')->filter()->all();
        $cc = collect($chatMessage->cc ?? [])->pluck('address')->filter()->all();
        $bcc = collect($chatMessage->bcc ?? [])->pluck('address')->filter()->all();

        $sentMessage = Mail::mailer(config('mail.default'))
            ->to($to)
            ->cc($cc)
            ->bcc($bcc)
            ->send(new ComposedMail($chatMessage));

        $messageId = $sentMessage ? trim((string) $sentMessage->getMessageId(), '<>') : null;

        $chatMessage->update([
            'status' => ChatStatus::SENT->value,
            'message_id' => $messageId ?: $chatMessage->message_id,
            'mailgun_message_id' => $messageId,
            'sent_at' => now(),
        ]);
    }

    /**
     * The underlying queue job's id, used to claim a message so only one
     * job instance ever sends it. Null outside a real queue worker (e.g.
     * the sync driver, or a job invoked directly in a test).
     */
    protected function currentJobId(): ?string
    {
        return $this->job?->getJobId();
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Failed to send chat message', [
            'chat_message_id' => $this->chatMessageId,
            'error' => $exception->getMessage(),
        ]);

        ChatMessage::where('id', $this->chatMessageId)->update([
            'status' => ChatStatus::FAILED->value,
            'error_message' => $exception->getMessage(),
        ]);
    }
}
