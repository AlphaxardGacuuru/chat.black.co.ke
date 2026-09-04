<?php

namespace App\Http\Services;

use App\Enums\ChatFolder;
use App\Http\Services\Concerns\ResolvesChatThread;
use App\Models\ChatLabel;
use App\Models\ChatMessage;
use App\Models\ChatThread;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ChatThreadService extends Service
{
    use ResolvesChatThread;

    public function index(Request $request)
    {
        $folder = $request->input('folder', ChatFolder::INBOX->value);
        $labelId = $request->input('label');
        $q = trim((string) $request->input('q', ''));

        $query = ChatThread::query()
            ->ownedBy($this->id);

        if ($request->boolean('starred') || $folder === 'starred') {
            $query->starred();
        } elseif ($folder) {
            $query->folder($folder);
        }

        if ($labelId) {
            $query->whereHas('messages.labels', fn ($labelQuery) => $labelQuery->where('chat_labels.id', $labelId));
        }

        if ($q !== '') {
            $query->whereHas('messages', function ($messageQuery) use ($q) {
                $messageQuery->whereFullText('search_index', $q.'*', ['mode' => 'boolean'])
                    ->orWhere('subject', 'like', "%{$q}%");
            });
        }

        $threads = $query->orderByDesc('last_message_at')->paginate(20);

        return [true, $threads->total().' Threads Retrieved', $threads];
    }

    public function show(string $id)
    {
        $thread = ChatThread::ownedBy($this->id)
            ->with(['messages.attachments', 'messages.labels'])
            ->findOrFail($id);

        $thread->messages()->where('is_read', false)->update(['is_read' => true]);
        $thread->refresh();
        $thread->load(['messages.attachments', 'messages.labels']);
        $this->refreshThreadAggregates($thread);

        return [true, 'Thread Retrieved Successfully', $thread];
    }

    public function update(
        string $id,
        ?string $folder,
        ?bool $isStarred,
        ?bool $isRead,
        ?bool $restore = false,
    )
    {
        $thread = ChatThread::ownedBy($this->id)->findOrFail($id);

        if ($restore) {
            foreach ($thread->messages as $message) {
                $this->restoreMessageFolder($message);
            }
        } elseif ($folder === ChatFolder::INBOX->value) {
            foreach ($thread->messages as $message) {
                $target = $message->direction === 'outbound'
                    ? ChatFolder::SENT->value
                    : ChatFolder::INBOX->value;
                $this->moveMessageFolder($message, $target);
            }
        } elseif ($folder !== null) {
            foreach ($thread->messages as $message) {
                $this->moveMessageFolder($message, $folder);
            }
        }

        if ($isStarred !== null) {
            $thread->messages()->update(['is_starred' => $isStarred]);
            $thread->is_starred = $isStarred;
            $thread->save();
        }

        if ($isRead !== null) {
            $thread->messages()->update(['is_read' => $isRead]);
            $thread->has_unread = ! $isRead;
            $thread->save();
        }

        return [true, 'Thread Updated', $thread];
    }

    protected function moveMessageFolder(ChatMessage $message, string $targetFolder): void
    {
        if ($message->folder === $targetFolder) {
            return;
        }

        $history = $message->folder_history ?? [];
        $history[] = ['folder' => $message->folder, 'at' => now()->toIso8601String()];

        $message->folder_history = $history;
        $message->folder = $targetFolder;
        $message->save();
    }

    protected function restoreMessageFolder(ChatMessage $message): void
    {
        $history = $message->folder_history ?? [];
        $previous = array_pop($history);
        $targetFolder = $previous['folder'] ?? ChatFolder::INBOX->value;

        $message->folder_history = $history;
        $message->folder = $targetFolder;
        $message->save();
    }

    public function destroy(string $id)
    {
        $thread = ChatThread::ownedBy($this->id)->with('messages.attachments')->findOrFail($id);

        $notInTrash = $thread->messages->contains(fn ($message) => $message->folder !== ChatFolder::TRASH->value);

        if ($notInTrash) {
            throw ValidationException::withMessages([
                'thread' => ['Move this thread to trash before deleting it permanently.'],
            ]);
        }

        foreach ($thread->messages as $message) {
            foreach ($message->attachments as $attachment) {
                Storage::disk($attachment->disk)->delete($attachment->path);
            }
        }

        $deleted = $thread->delete();

        return [$deleted, 'Thread Permanently Deleted', null];
    }

    public function attachLabel(string $threadId, string $labelId)
    {
        $thread = ChatThread::ownedBy($this->id)->findOrFail($threadId);
        $label = ChatLabel::where('user_id', $this->id)->findOrFail($labelId);

        foreach ($thread->messages as $message) {
            $message->labels()->syncWithoutDetaching([$label->id]);
        }

        return [true, 'Label Applied', $thread];
    }

    public function detachLabel(string $threadId, string $labelId)
    {
        $thread = ChatThread::ownedBy($this->id)->findOrFail($threadId);
        $label = ChatLabel::where('user_id', $this->id)->findOrFail($labelId);

        foreach ($thread->messages as $message) {
            $message->labels()->detach($label->id);
        }

        return [true, 'Label Removed', $thread];
    }
}
