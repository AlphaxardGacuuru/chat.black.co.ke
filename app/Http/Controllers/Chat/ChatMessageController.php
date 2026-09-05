<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChatMessageResource;
use App\Http\Services\ChatMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatMessageController extends Controller
{
    public function __construct(protected ChatMessageService $service) {}

    public function store(Request $request, string $conversationId): JsonResponse
    {
        $this->validate($request, [
            'body' => 'nullable|string',
            'temporaryUploadIds' => 'sometimes|array',
        ]);

        [$saved, $message, $chatMessage] = $this->service->send(
            $conversationId,
            $request->input('body'),
            $request->input('temporaryUploadIds', [])
        );

        return response()->json([
            'saved' => $saved,
            'message' => $message,
            'data' => $chatMessage ? ChatMessageResource::make($chatMessage) : null,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        [$deleted, $message] = $this->service->destroy($id);

        return response()->json([
            'deleted' => $deleted,
            'message' => $message,
        ]);
    }
}
