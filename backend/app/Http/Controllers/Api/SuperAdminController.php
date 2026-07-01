<?php

namespace App\Http\Controllers\Api;

use App\Domain\Analytics\SaaSAnalyticsService;
use App\Domain\Tenant\TenantService;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class SuperAdminController extends Controller
{
    use ApiResponse;

    public function __construct(
        private TenantService $tenantService,
        private SaaSAnalyticsService $analyticsService,
    ) {}

    public function tenants(Request $request)
    {
        return $this->success(
            $this->tenantService->listAll($request->all(), (int) $request->get('per_page', 15))
        );
    }

    public function showTenant(Tenant $tenant)
    {
        return $this->success(
            $tenant->load(['subscription.plan'])->loadCount(['users', 'vehicles', 'drivers'])
        );
    }

    public function suspendTenant(Tenant $tenant)
    {
        return $this->success(
            $this->tenantService->suspend($tenant),
            'Tenant suspended successfully.'
        );
    }

    public function activateTenant(Tenant $tenant)
    {
        return $this->success(
            $this->tenantService->activate($tenant),
            'Tenant activated successfully.'
        );
    }

    public function analytics()
    {
        return $this->success($this->analyticsService->getPlatformMetrics());
    }

    public function globalLogs(Request $request)
    {
        $logs = \App\Models\AuditLog::withoutGlobalScope('tenant')
            ->with('user')
            ->when($request->entity_type ?? $request->entity, fn ($q, $entity) => $q->where('entity_type', $entity))
            ->when($request->tenant_id, fn ($q, $tid) => $q->where('tenant_id', $tid))
            ->latest()
            ->paginate((int) $request->get('per_page', 20));

        return $this->success($logs);
    }
}
