<?php

namespace App\Domain\Analytics;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\Vehicle;
use App\Services\TenantContext;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SaaSAnalyticsService
{
    public function __construct(private TenantContext $tenantContext) {}

    public function getPlatformMetrics(): array
    {
        return Cache::remember('saas:platform_metrics', 300, function () {
            $activeSubscriptions = Subscription::where('status', 'active')->count();
            $mrr = Subscription::where('status', 'active')
                ->join('plans', 'subscriptions.plan_id', '=', 'plans.id')
                ->selectRaw("SUM(CASE WHEN subscriptions.billing_cycle = 'yearly' THEN plans.price_yearly / 12 ELSE plans.price_monthly END) as mrr")
                ->value('mrr') ?? 0;

            $usageByPlan = Plan::withCount([
                'subscriptions as active_subscriptions' => fn ($q) => $q->where('status', 'active'),
            ])->get()->map(fn ($plan) => [
                'plan' => $plan->name,
                'slug' => $plan->slug,
                'active_subscriptions' => $plan->active_subscriptions,
            ]);

            return [
                'total_tenants' => Tenant::count(),
                'active_tenants' => Tenant::where('status', 'active')->count(),
                'suspended_tenants' => Tenant::where('status', 'suspended')->count(),
                'trial_tenants' => Tenant::where('status', 'trial')->count(),
                'active_subscriptions' => $activeSubscriptions,
                'mrr' => round((float) $mrr, 2),
                'total_vehicles' => Vehicle::withoutGlobalScope('tenant')->count(),
                'vehicles_per_tenant' => Tenant::withCount('vehicles')
                    ->orderByDesc('vehicles_count')
                    ->limit(10)
                    ->get(['id', 'name', 'slug']),
                'usage_by_plan' => $usageByPlan,
                'recent_activity' => DB::table('logs')
                    ->orderByDesc('created_at')
                    ->limit(20)
                    ->get(['id', 'action', 'entity_type', 'entity_id', 'created_at']),
            ];
        });
    }

    public function getTenantDashboard(): array
    {
        $tenantId = $this->tenantContext->id();

        return Cache::remember("saas:tenant_metrics:{$tenantId}", 60, function () use ($tenantId) {
            return [
                'vehicles_count' => Vehicle::where('tenant_id', $tenantId)->count(),
                'drivers_count' => \App\Models\Driver::where('tenant_id', $tenantId)->count(),
                'trips_count' => \App\Models\Trip::where('tenant_id', $tenantId)->count(),
                'active_trips' => \App\Models\Trip::where('tenant_id', $tenantId)->where('status', 'ongoing')->count(),
                'maintenance_count' => \App\Models\Maintenance::where('tenant_id', $tenantId)->count(),
                'maintenance_cost' => round((float) \App\Models\Maintenance::where('tenant_id', $tenantId)->sum('cost'), 2),
            ];
        });
    }
}
