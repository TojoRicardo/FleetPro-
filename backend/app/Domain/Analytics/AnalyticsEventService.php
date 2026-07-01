<?php

namespace App\Domain\Analytics;

use App\Models\AnalyticsEvent;
use App\Services\TenantContext;

class AnalyticsEventService
{
    public function __construct(private TenantContext $tenantContext) {}

    public function track(string $eventType, ?array $payload = null, ?int $tenantId = null): ?AnalyticsEvent
    {
        $tenantId = $tenantId ?? $this->tenantContext->id();

        if (! $tenantId) {
            return null;
        }

        return AnalyticsEvent::create([
            'tenant_id' => $tenantId,
            'event_type' => $eventType,
            'payload' => $payload,
        ]);
    }
}
