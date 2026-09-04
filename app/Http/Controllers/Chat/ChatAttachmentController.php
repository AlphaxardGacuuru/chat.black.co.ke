<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Models\ChatAttachment;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatAttachmentController extends Controller
{
    public function download(string $id): StreamedResponse
    {
        $userId = auth('sanctum')->id();

        $attachment = ChatAttachment::whereHas(
            'message',
            fn ($query) => $query->where('user_id', $userId)
        )->findOrFail($id);

        return Storage::disk($attachment->disk)->download(
            $attachment->path,
            $attachment->original_name ?? basename($attachment->path)
        );
    }
}
