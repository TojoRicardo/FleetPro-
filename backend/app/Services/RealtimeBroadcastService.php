<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RealtimeBroadcastService
{
    public function broadcast(string $channel, string $event, array $data = []): void
    {
        $url = config('fleetpro.realtime.broadcast_url');
        $secret = config('fleetpro.realtime.internal_secret');

        if (blank($url)) {
            return;
        }

        try {
            Http::timeout(3)
                ->withHeaders(['X-Realtime-Secret' => $secret])
                ->post($url, compact('channel', 'event', 'data'));
        } catch (\Throwable $e) {
            Log::warning('realtime.broadcast.failed', [
                'channel' => $channel,
                'event' => $event,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function toTenant(int $tenantId, string $event, array $data = []): void
    {
        $this->broadcast("tenant.{$tenantId}", $event, $data);
    }

    public function toUser(int $userId, string $event, array $data = []): void
    {
        $this->broadcast("user.{$userId}", $event, $data);
    }
}
