<?php

namespace Tests\Feature;

use App\Http\Services\ChatConversationService;
use App\Http\Services\ChatMessageService;
use App\Models\ChatConversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatConversationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_starting_a_conversation_creates_one_with_both_participants(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($me, 'sanctum');
        $service = new ChatConversationService;

        [$saved, $message, $conversation] = $service->startWith($other->id);

        $this->assertTrue($saved);
        $this->assertSame('Conversation Started', $message);
        $this->assertDatabaseHas('chat_conversation_participants', [
            'conversation_id' => $conversation->id,
            'user_id' => $me->id,
        ]);
        $this->assertDatabaseHas('chat_conversation_participants', [
            'conversation_id' => $conversation->id,
            'user_id' => $other->id,
        ]);
    }

    public function test_starting_a_conversation_twice_reuses_the_existing_one(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($me, 'sanctum');
        $service = new ChatConversationService;

        [, , $first] = $service->startWith($other->id);
        [, $message, $second] = $service->startWith($other->id);

        $this->assertSame($first->id, $second->id);
        $this->assertSame('Conversation Already Exists', $message);
        $this->assertSame(1, ChatConversation::count());
    }

    public function test_marking_a_conversation_read_updates_the_participants_pivot(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();

        $conversation = ChatConversation::create(['type' => 'direct']);
        $conversation->participants()->attach([$me->id, $other->id]);

        $this->actingAs($me, 'sanctum');
        $service = new ChatConversationService;

        [$status] = $service->markRead($conversation->id);

        $this->assertTrue($status);
        $this->assertNotNull(
            $conversation->participants()->where('users.id', $me->id)->first()->pivot->last_read_at
        );
    }

    public function test_a_message_reads_as_read_once_the_recipient_has_caught_up(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();

        $conversation = ChatConversation::create(['type' => 'direct']);
        $conversation->participants()->attach([$me->id, $other->id]);

        $this->actingAs($me, 'sanctum');
        [, , $message] = (new ChatMessageService)->send($conversation->id, 'Hello there');

        $this->actingAs($other, 'sanctum');
        [, , , $beforeRead] = (new ChatConversationService)->show($conversation->id);
        $this->assertFalse($beforeRead->getCollection()->firstWhere('id', $message->id)->is_read_by_recipient);

        (new ChatConversationService)->markRead($conversation->id);

        $this->actingAs($me, 'sanctum');
        [, , , $afterRead] = (new ChatConversationService)->show($conversation->id);
        $this->assertTrue($afterRead->getCollection()->firstWhere('id', $message->id)->is_read_by_recipient);
    }
}
