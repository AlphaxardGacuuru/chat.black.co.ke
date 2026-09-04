<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChatLabelResource;
use App\Http\Services\ChatLabelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ChatLabelController extends Controller
{
    public function __construct(protected ChatLabelService $service) {}

    public function index(): AnonymousResourceCollection
    {
        [$status, $message, $labels] = $this->service->index();

        return ChatLabelResource::collection($labels)
            ->additional([
                'status' => $status,
                'message' => $message
            ]);
    }

    public function store(Request $request): ChatLabelResource
    {
        $this->validate($request, [
            'name' => 'required|string|max:100',
            'color' => 'nullable|string|max:20',
        ]);

        [$saved, $message, $label] = $this->service->store($request);

        return ChatLabelResource::make($label)
            ->additional([
                'saved' => $saved,
                'message' => $message
            ]);
    }

    public function show(): JsonResponse
    {
        return response()->json([
            'message' => 'Individual label retrieval is not supported.',
        ], 405);
    }

    public function update(Request $request, string $id): ChatLabelResource
    {
        $this->validate($request, [
            'name' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:20',
        ]);

        [$saved, $message, $label] = $this->service->update($request, $id);

        return ChatLabelResource::make($label)
            ->additional([
                'saved' => $saved,
                'message' => $message
            ]);
    }

    public function destroy(string $id): JsonResponse
    {
        [$deleted, $message] = $this->service->destroy($id);

        return response()->json([
            'deleted' => $deleted,
            'message' => $message
        ]);
    }
}
