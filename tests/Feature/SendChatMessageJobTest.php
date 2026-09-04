<?php

namespace Tests\Feature;

use App\Enums\ChatStatus;
use App\Jobs\SendChatMessageJob;
use App\Mail\ComposedMail;
use App\Models\ChatMessage;
use App\Models\ChatThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SendChatMessageJobTest extends TestCase
{
    use RefreshDatabase;

    protected function makeOutboundMessage(User $user, array $overrides = []): ChatMessage
    {
        $thread = ChatThread::create(['user_id' => $user->id, 'subject' => 'Project update']);

        return ChatMessage::create(array_merge([
            'chat_thread_id' => $thread->id,
            'user_id' => $user->id,
            'direction' => 'outbound',
            'folder' => 'sent',
            'subject' => 'Project update',
            'to' => [['address' => 'recipient@example.com', 'name' => null]],
            'status' => ChatStatus::QUEUED->value,
        ], $overrides));
    }

    public function test_it_sends_and_claims_the_message_with_its_job_id(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $chatMessage = $this->makeOutboundMessage($user);

        $job = new TestableSendChatMessageJob($chatMessage->id);
        $job->fakeJobId = 'job-1';
        $job->handle();

        Mail::assertSent(ComposedMail::class);
        $chatMessage->refresh();
        $this->assertSame(ChatStatus::SENT->value, $chatMessage->status);
        $this->assertSame('job-1', $chatMessage->job_id);
    }

    public function test_a_different_job_id_cannot_claim_an_already_claimed_message(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $chatMessage = $this->makeOutboundMessage($user, ['job_id' => 'job-1']);

        $job = new TestableSendChatMessageJob($chatMessage->id);
        $job->fakeJobId = 'job-2';
        $job->handle();

        Mail::assertNothingSent();
        $chatMessage->refresh();
        $this->assertSame(ChatStatus::QUEUED->value, $chatMessage->status);
        $this->assertSame('job-1', $chatMessage->job_id);
    }

    public function test_the_same_job_id_can_reclaim_its_own_message(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $chatMessage = $this->makeOutboundMessage($user, ['job_id' => 'job-1']);

        $job = new TestableSendChatMessageJob($chatMessage->id);
        $job->fakeJobId = 'job-1';
        $job->handle();

        Mail::assertSent(ComposedMail::class);
        $chatMessage->refresh();
        $this->assertSame(ChatStatus::SENT->value, $chatMessage->status);
    }

    public function test_it_does_not_resend_an_already_sent_message(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $chatMessage = $this->makeOutboundMessage($user, [
            'status' => ChatStatus::SENT->value,
            'job_id' => 'job-1',
        ]);

        $job = new TestableSendChatMessageJob($chatMessage->id);
        $job->fakeJobId = 'job-2';
        $job->handle();

        Mail::assertNothingSent();
    }
}

class TestableSendChatMessageJob extends SendChatMessageJob
{
    public ?string $fakeJobId = null;

    protected function currentJobId(): ?string
    {
        return $this->fakeJobId;
    }
}
