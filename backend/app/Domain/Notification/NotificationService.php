<?php

namespace App\Domain\Notification;

use App\Events\NotificationSent;
use App\Models\Notification;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Support\Str;

class NotificationService
{
    public function __construct(private TenantContext $tenantContext) {}

    public function send(User $user, string $type, string $title, string $message, ?array $data = null): Notification
    {
        $notification = Notification::create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $this->tenantContext->id() ?? $user->tenant_id,
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        event(new NotificationSent($notification));

        return $notification;
    }

    public function sendToTenantAdmins(string $type, string $title, string $message, ?array $data = null): void
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return;
        }

        User::where('tenant_id', $tenantId)
            ->whereIn('role', ['admin', 'super_admin'])
            ->each(fn (User $user) => $this->send($user, $type, $title, $message, $data));
    }

    public function getForUser(User $user, int $perPage = 20)
    {
        return Notification::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function markAsRead(string $id, User $user): void
    {
        Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->update(['read_at' => now()]);
    }

    public function markAllAsRead(User $user): void
    {
        Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function unreadCount(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
    }
}
