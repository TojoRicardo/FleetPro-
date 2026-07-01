<?php

namespace App\Http\Controllers\Api;

use App\Domain\Notification\NotificationService;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponse;

    public function __construct(private NotificationService $notificationService) {}

    public function index(Request $request)
    {
        return $this->success(
            $this->notificationService->getForUser($request->user(), (int) $request->get('per_page', 20))
        );
    }

    public function unreadCount(Request $request)
    {
        return $this->success([
            'count' => $this->notificationService->unreadCount($request->user()),
        ]);
    }

    public function markAsRead(Request $request, string $id)
    {
        $this->notificationService->markAsRead($id, $request->user());

        return $this->success(null, 'Notification marked as read.');
    }

    public function markAllAsRead(Request $request)
    {
        $this->notificationService->markAllAsRead($request->user());

        return $this->success(null, 'All notifications marked as read.');
    }
}
