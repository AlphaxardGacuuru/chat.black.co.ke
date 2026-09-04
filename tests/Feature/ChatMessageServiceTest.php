<?php

namespace Tests\Feature;

use App\Enums\ChatStatus;
use App\Http\Services\ChatMessageService;
use App\Http\Services\ChatSanitizerService;
use App\Models\ChatMessage;
use App\Models\ChatThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatMessageServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_outbound_message_returns_saved_result_and_message(): void
    {
        $user = User::factory()->create();

        $service = new TestChatMessageService(new ChatSanitizerService);

        [$saved, $chatMessage] = $service->createOutboundMessageForTest($user, [
            'to' => [
                ['address' => 'recipient@example.com', 'name' => null],
            ],
            'cc' => [],
            'bcc' => [],
            'subject' => 'Project update',
            'bodyHtml' => '<p>Hello team</p>',
            'inReplyTo' => null,
            'references' => null,
            'participantEmail' => 'recipient@example.com',
        ], []);

        $this->assertTrue($saved);
        $this->assertInstanceOf(ChatMessage::class, $chatMessage);
        $this->assertTrue($chatMessage->exists);
        $this->assertDatabaseHas('chat_messages', [
            'id' => $chatMessage->id,
            'user_id' => $user->id,
            'subject' => 'Project update',
        ]);
    }

    public function test_retry_resets_a_failed_outbound_message_to_queued(): void
    {
        $user = User::factory()->create();
        $thread = ChatThread::create(['user_id' => $user->id, 'subject' => 'Project update']);
        $chatMessage = ChatMessage::create([
            'chat_thread_id' => $thread->id,
            'user_id' => $user->id,
            'direction' => 'outbound',
            'folder' => 'sent',
            'subject' => 'Project update',
            'status' => ChatStatus::FAILED->value,
            'error_message' => 'Connection refused',
        ]);

        $this->actingAs($user, 'sanctum');
        $service = new ChatMessageService(new ChatSanitizerService);

        $retried = $service->retry($chatMessage->id);

        $this->assertSame(ChatStatus::QUEUED->value, $retried->status);
        $this->assertNull($retried->error_message);
        $this->assertDatabaseHas('chat_messages', [
            'id' => $chatMessage->id,
            'status' => ChatStatus::QUEUED->value,
            'error_message' => null,
        ]);
    }

    public function test_retry_rejects_a_message_that_is_not_in_a_failed_state(): void
    {
        $user = User::factory()->create();
        $thread = ChatThread::create(['user_id' => $user->id, 'subject' => 'Project update']);
        $chatMessage = ChatMessage::create([
            'chat_thread_id' => $thread->id,
            'user_id' => $user->id,
            'direction' => 'outbound',
            'folder' => 'sent',
            'subject' => 'Project update',
            'status' => ChatStatus::SENT->value,
        ]);

        $this->actingAs($user, 'sanctum');
        $service = new ChatMessageService(new ChatSanitizerService);

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);

        $service->retry($chatMessage->id);
    }

    public function test_retry_rejects_a_message_belonging_to_another_user(): void
    {
        $owner = User::factory()->create();
        $thread = ChatThread::create(['user_id' => $owner->id, 'subject' => 'Project update']);
        $chatMessage = ChatMessage::create([
            'chat_thread_id' => $thread->id,
            'user_id' => $owner->id,
            'direction' => 'outbound',
            'folder' => 'sent',
            'subject' => 'Project update',
            'status' => ChatStatus::FAILED->value,
        ]);

        $intruder = User::factory()->create();
        $this->actingAs($intruder, 'sanctum');
        $service = new ChatMessageService(new ChatSanitizerService);

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);

        $service->retry($chatMessage->id);
    }
}

class TestChatMessageService extends ChatMessageService
{
    /**
     * @param  array<string, mixed>  $fields
     * @param  array<int, mixed>  $temporaryUploadIds
     * @return array{0: bool, 1: ChatMessage}
     */
    public function createOutboundMessageForTest(User $user, array $fields, array $temporaryUploadIds): array
    {
        return $this->createOutboundMessage($user, $fields, $temporaryUploadIds);
    }
}
