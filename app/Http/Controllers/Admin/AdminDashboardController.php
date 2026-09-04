<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ChatStatus;
use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $statusCounts = ChatMessage::query()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $totals = [
            'chatsSent' => (int) ($statusCounts[ChatStatus::SENT->value] ?? 0),
            'chatsFailed' => (int) ($statusCounts[ChatStatus::FAILED->value] ?? 0),
            'chatsQueued' => (int) ($statusCounts[ChatStatus::QUEUED->value] ?? 0),
            'totalUsers' => (int) User::query()->count(),
        ];

        $statusBreakdown = collect(ChatStatus::cases())
            ->map(fn (ChatStatus $status) => [
                'status' => $status->value,
                'count' => (int) ($statusCounts[$status->value] ?? 0),
            ])
            ->values();

        $days = collect(range(13, 0))
            ->map(fn (int $offset) => now()->subDays($offset)->toDateString());

        $dailyRows = ChatMessage::query()
            ->where('direction', 'outbound')
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->selectRaw('DATE(created_at) as date, status, count(*) as aggregate')
            ->groupBy('date', 'status')
            ->get();

        $dailyVolume = $days->map(function (string $date) use ($dailyRows) {
            $rowsForDate = $dailyRows->filter(fn ($row) => $row->date === $date);

            return [
                'date' => $date,
                'sent' => (int) $rowsForDate
                    ->where('status', ChatStatus::SENT->value)
                    ->sum('aggregate'),
                'failed' => (int) $rowsForDate
                    ->where('status', ChatStatus::FAILED->value)
                    ->sum('aggregate'),
            ];
        })->values();

        $recentFailures = ChatMessage::query()
            ->where('status', ChatStatus::FAILED->value)
            ->latest('created_at')
            ->limit(5)
            ->get(['id', 'subject', 'to', 'status', 'error_message', 'created_at'])
            ->map(fn (ChatMessage $message) => [
                'id' => $message->id,
                'subject' => $message->subject,
                'to' => collect($message->to ?? [])->pluck('address')->implode(', '),
                'status' => $message->status,
                'errorMessage' => $message->error_message,
                'createdAt' => $message->created_at,
            ])
            ->values();

        return response()->json([
            'data' => [
                'totals' => $totals,
                'statusBreakdown' => $statusBreakdown,
                'dailyVolume' => $dailyVolume,
                'recentFailures' => $recentFailures,
            ],
        ]);
    }
}
