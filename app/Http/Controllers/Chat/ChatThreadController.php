<?php

namespace App\Http\Controllers\Chat;

use App\Enums\ChatFolder;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChatThreadResource;
use App\Http\Services\ChatThreadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ChatThreadController extends Controller
{
    public function __construct(protected ChatThreadService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        [$status, $message, $threads] = $this->service->index($request);

        return ChatThreadResource::collection($threads)
            ->additional([
                'status' => $status,
                'message' => $message
            ]);
    }

    public function show(string $id): ChatThreadResource
    {
        [$status, $message, $thread] = $this->service->show($id);

        return ChatThreadResource::make($thread)
            ->additional([
                'status' => $status,
                'message' => $message
            ]);
    }

    public function store(): JsonResponse
    {
        return response()->json([
            'message' => 'Create threads by sending a message.',
        ], 405);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'folder' => ['required_without_all:isStarred,isRead,restore', 'string', Rule::in([
                ChatFolder::ARCHIVE->value,
                ChatFolder::TRASH->value,
                ChatFolder::INBOX->value,
            ])],
            'restore' => ['sometimes', 'boolean'],
            'isStarred' => ['sometimes', 'boolean'],
            'isRead' => ['sometimes', 'boolean'],
        ]);

        return $this->respondWith($this->service->update(
            $id,
            $data['folder'] ?? null,
            $data['isStarred'] ?? null,
            $data['isRead'] ?? null,
            $data['restore'] ?? false,
        ));
    }

    public function destroy(string $id): JsonResponse
    {
        [$deleted, $message] = $this->service->destroy($id);

        return response()->json(['deleted' => $deleted, 'message' => $message]);
    }

    public function attachLabel(Request $request, string $id): JsonResponse
    {
        $this->validate($request, ['labelId' => 'required|uuid|exists:chat_labels,id']);

        return $this->respondWith($this->service->attachLabel($id, $request->input('labelId')));
    }

    public function detachLabel(string $id, string $labelId): JsonResponse
    {
        return $this->respondWith($this->service->detachLabel($id, $labelId));
    }

    protected function respondWith(array $result): JsonResponse
    {
        [$status, $message, $thread] = $result;

        return response()->json([
            'status' => $status,
            'message' => $message,
            'data' => $thread ? ChatThreadResource::make($thread) : null,
        ]);
    }
}
