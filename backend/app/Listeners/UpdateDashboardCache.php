<?php

namespace App\Listeners;

use App\Events\DashboardUpdated;
use App\Events\EntityAudited;
use App\Services\DashboardService;
use Illuminate\Support\Facades\Cache;

class UpdateDashboardCache
{
    public function __construct(private DashboardService $dashboardService) {}

    public function handle(EntityAudited $event): void
    {
        $tenantId = $event->model->tenant_id ?? null;

        if ($tenantId) {
            Cache::forget("dashboard.stats.{$tenantId}");
            Cache::forget("saas:tenant_metrics:{$tenantId}");

            $stats = $this->dashboardService->getStatistics();

            event(new DashboardUpdated($tenantId, $stats));
        } else {
            Cache::forget('dashboard.stats');
        }
    }
}
