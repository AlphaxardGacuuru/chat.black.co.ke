<?php

namespace App\Mail;

use App\Models\ChatMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

class ComposedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ChatMessage $chatMessage,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->chatMessage->subject ?? '(no subject)',
        );
    }

    public function content(): Content
    {
        $body = $this->chatMessage->body_html ?? nl2br(e($this->chatMessage->body_text ?? ''));

        return new Content(htmlString: $body);
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return $this->chatMessage->attachments->map(
            fn($attachment) => Attachment::fromStorageDisk($attachment->disk, $attachment->path)
                ->as($attachment->original_name ?? basename($attachment->path))
                ->withMime($attachment->mime_type ?? 'application/octet-stream')
        )->all();
    }

    public function headers(): Headers
    {
        $references = array_filter(preg_split('/\s+/', trim((string) $this->chatMessage->references)) ?: []);

        return new Headers(
            references: $references,
            text: array_filter([
                'In-Reply-To' => $this->chatMessage->in_reply_to ? "<{$this->chatMessage->in_reply_to}>" : null,
            ]),
        );
    }
}
