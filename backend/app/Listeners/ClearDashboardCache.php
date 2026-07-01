<?php

namespace App\Listeners;

use App\Events\EntityAudited;
use App\Services\DashboardService;
use App\Services\RealtimeBroadcastService;

class ClearDashboardCache
{
    public function __construct(
        private DashboardService $dashboardService,
        private RealtimeBroadcastService $realtime,
    ) {}

    public function handle(EntityAudited $event): void
    {
        $entity = strtolower(class_basename($event->model));

        if (in_array($entity, ['vehicle', 'driver', 'trip', 'maintenance', 'assignment'], true)) {
            $this->dashboardService->clearCache();

            $tenantId = $event->model->tenant_id ?? null;
            if ($tenantId) {
                $this->realtime->toTenant($tenantId, 'dashboard.updated');
            }
        }
    }
}
