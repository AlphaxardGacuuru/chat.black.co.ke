<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChatMessageResource;
use App\Http\Services\ChatMessageService;
use Illuminate\Http\Request;
use App\Jobs\SendChatMessageJob;

class ChatMessageController extends Controller
{
    public function __construct(protected ChatMessageService $service) {}

    protected function rules(bool $requiresTo): array
    {
        return [
            'to' => $requiresTo ? 'required|array|min:1' : 'nullable|array',
            'to.*' => 'string',
            'cc' => 'nullable|array',
            'cc.*' => 'string',
            'bcc' => 'nullable|array',
            'bcc.*' => 'string',
            'subject' => 'required|string|max:255',
            'bodyHtml' => 'nullable|string',
            'temporaryUploadIds' => 'nullable|array',
            'temporaryUploadIds.*' => 'integer|exists:temporary_uploads,id',
        ];
    }

    /**
     * Compose a new message.
     */
    public function store(Request $request): ChatMessageResource
    {
        $this->validate($request, $this->rules(requiresTo: true));

        [$saved, $message, $chatMessage] = $this->service->store($request);

        SendChatMessageJob::dispatchIf($saved, $chatMessage->id);

        return ChatMessageResource::make($chatMessage)
            ->additional([
                'saved' => $saved,
                'message' => $message
            ]);
    }

    public function reply(Request $request, string $id): ChatMessageResource
    {
        $this->validate($request, $this->rules(requiresTo: false));

        [$saved, $message, $chatMessage] = $this->service->respond($request, $id, 'reply');

        return ChatMessageResource::make($chatMessage)
            ->additional([
                'saved' => $saved,
                'message' => $message
            ]);
    }

    public function replyAll(Request $request, string $id): ChatMessageResource
    {
        $this->validate($request, $this->rules(requiresTo: false));

        [$saved, $message, $chatMessage] = $this->service->respond($request, $id, 'reply-all');

        SendChatMessageJob::dispatchIf($saved, $chatMessage->id);

        return ChatMessageResource::make($chatMessage)
            ->additional([
                'saved' => $saved,
                'message' => $message
            ]);
    }

    public function forward(Request $request, string $id): ChatMessageResource
    {
        $this->validate($request, $this->rules(requiresTo: true));

        [$saved, $message, $chatMessage] = $this->service->respond($request, $id, 'forward');

        SendChatMessageJob::dispatchIf($saved, $chatMessage->id);

        return ChatMessageResource::make($chatMessage)
            ->additional([
                'saved' => $saved,
                'message' => $message
            ]);
    }

    public function retry(string $id): ChatMessageResource
    {
        $chatMessage = $this->service->retry($id);

        SendChatMessageJob::dispatch($chatMessage->id);

        return ChatMessageResource::make($chatMessage)
            ->additional([
                'saved' => true,
                'message' => 'Message Queued for Sending',
            ]);
    }
}
