<?php

namespace App\Services;

use App\Repositories\Contracts\DashboardRepositoryInterface;
use App\Services\TenantContext;
use Illuminate\Support\Facades\Cache;

class DashboardService
{
    private const CACHE_KEY = 'fleetpro.dashboard.statistics';

    public function __construct(private DashboardRepositoryInterface $dashboardRepository) {}

    public function getDashboardPayload(): array
    {
        $tenantId = app(TenantContext::class)->id();
        $cacheKey = $tenantId ? "dashboard.stats.{$tenantId}" : self::CACHE_KEY;
        $ttl = (int) config('fleetpro.dashboard.cache_ttl', 60);

        $statistics = Cache::remember($cacheKey, $ttl, function () {
            return [
                'cached_at' => now()->toIso8601String(),
                'metrics' => $this->dashboardRepository->getAggregatedStatistics(),
            ];
        });

        $metrics = $statistics['metrics'];

        return [
            'statistics' => $this->extractCoreStatistics($metrics),
            'charts' => $this->buildChartData($metrics),
            'meta' => [
                'cached_at' => $statistics['cached_at'],
                'generated_at' => now()->toIso8601String(),
                'cache_ttl_seconds' => $ttl,
            ],
        ];
    }

    public function getStatistics(): array
    {
        return $this->getDashboardPayload()['statistics'];
    }

    public function clearCache(): void
    {
        $tenantId = app(TenantContext::class)->id();
        $cacheKey = $tenantId ? "dashboard.stats.{$tenantId}" : self::CACHE_KEY;
        Cache::forget($cacheKey);
    }

    private function extractCoreStatistics(array $stats): array
    {
        return [
            'total_vehicles' => $stats['total_vehicles'],
            'active_vehicles' => $stats['active_vehicles'],
            'vehicles_in_maintenance' => $stats['vehicles_in_maintenance'],
            'total_drivers' => $stats['total_drivers'],
            'active_drivers' => $stats['active_drivers'],
            'total_trips' => $stats['total_trips'],
            'ongoing_trips' => $stats['ongoing_trips'],
            'total_maintenance_cost' => $stats['total_maintenance_cost'],
        ];
    }

    private function buildChartData(array $stats): array
    {
        return [
            'vehicle_status' => [
                'active' => $stats['active_vehicles'],
                'maintenance' => $stats['vehicles_in_maintenance'],
                'inactive' => $stats['inactive_vehicles'],
            ],
            'trip_status' => [
                'scheduled' => $stats['scheduled_trips'],
                'ongoing' => $stats['ongoing_trips'],
                'completed' => $stats['completed_trips'],
                'cancelled' => $stats['cancelled_trips'],
            ],
        ];
    }
}
