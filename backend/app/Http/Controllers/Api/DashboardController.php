<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Concerns\ResolvesPagination;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Repositories\Contracts\AuditLogRepositoryInterface;
use App\Services\AuditLogEntityResolver;
use App\Services\DashboardService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DashboardController extends Controller
{
    use ApiResponse, ResolvesPagination;

    public function __construct(
        private DashboardService $dashboardService,
        private AuditLogRepositoryInterface $auditLogRepository,
    ) {}

    public function statistics(Request $request)
    {
        Gate::authorize('view-dashboard');

        return $this->success(
            $this->dashboardService->getDashboardPayload(),
            'Dashboard statistics retrieved successfully.'
        );
    }

    public function auditLogs(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        $filters = $request->only([
            'entity_type', 'entity', 'action', 'user_id', 'search',
            'result', 'date_from', 'date_to', 'session', 'sort',
        ]);
        $perPage = $this->resolvePerPage($request);

        $paginator = $this->auditLogRepository->all($filters, $perPage);

        return response()->json([
            'success' => true,
            'message' => 'Audit logs retrieved successfully.',
            'data' => $this->transformAuditLogs($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function auditLogStats(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        return $this->success(
            $this->auditLogRepository->getStatistics(),
            'Audit log statistics retrieved successfully.'
        );
    }

    public function exportAuditLogs(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        $filters = $request->only([
            'entity_type', 'entity', 'action', 'user_id', 'search',
            'result', 'date_from', 'date_to', 'session', 'sort',
        ]);

        $logs = $this->auditLogRepository->exportAll($filters, 1000);

        return $this->success(
            $this->transformAuditLogs($logs),
            'Audit logs export ready.'
        );
    }

    /** @param array<int, AuditLog> $logs */
    private function transformAuditLogs(array $logs): array
    {
        $resolver = new AuditLogEntityResolver;
        $resolver->preload(collect($logs));

        return collect($logs)
            ->map(fn (AuditLog $log) => (new AuditLogResource($log, $resolver))->resolve())
            ->all();
    }
}
