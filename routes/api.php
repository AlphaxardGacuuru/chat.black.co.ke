<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\FilePondController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\Chat\ChatAttachmentController;
use App\Http\Controllers\Chat\ChatLabelController;
use App\Http\Controllers\Chat\ChatMessageController;
use App\Http\Controllers\Chat\ChatThreadController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
 */

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')->group(function () {

    Route::get('auth', [UserController::class, 'auth']);

    Route::apiResources([
        "users" => UserController::class,
        "notifications" => NotificationController::class,
        "integrations" => IntegrationController::class,
        "support-tickets" => SupportTicketController::class,
        "settings" => SettingController::class,
        "threads" => ChatThreadController::class,
        "labels" => ChatLabelController::class,
    ]);

    Route::post('push-subscriptions', [PushSubscriptionController::class, 'store']);
    Route::delete('push-subscriptions', [PushSubscriptionController::class, 'destroy']);

    Route::post('threads/{id}/labels', [ChatThreadController::class, 'attachLabel']);
    Route::delete('threads/{id}/labels/{labelId}', [ChatThreadController::class, 'detachLabel']);

    Route::post('messages', [ChatMessageController::class, 'store']);
    Route::post('messages/{id}/reply', [ChatMessageController::class, 'reply']);
    Route::post('messages/{id}/reply-all', [ChatMessageController::class, 'replyAll']);
    Route::post('messages/{id}/forward', [ChatMessageController::class, 'forward']);
    Route::post('messages/{id}/retry', [ChatMessageController::class, 'retry']);

    Route::get('attachments/{id}/download', [ChatAttachmentController::class, 'download'])
        ->name('attachments.download');

});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
});

/*
 * Filepond Controller
 */
Route::prefix('filepond')->group(function () {
    Route::controller(FilePondController::class)->group(function () {
        // User
        Route::post('avatar/{id}', 'updateAvatar');

        // Support Tickets
        Route::post('support-tickets/attachments', 'storeSupportTicketAttachment');
        Route::delete('support-tickets/attachments/{id}', 'destroySupportTicketAttachment');

        Route::post('attachments', 'storeChatAttachment');
        Route::delete('attachments/{id}', 'destroyChatAttachment');
    });
});
