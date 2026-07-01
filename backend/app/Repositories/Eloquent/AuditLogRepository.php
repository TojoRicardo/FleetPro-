<?php

namespace App\Repositories\Eloquent;

use App\Models\AuditLog;
use App\Repositories\Contracts\AuditLogRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class AuditLogRepository implements AuditLogRepositoryInterface
{
    public function __construct(private AuditLog $model) {}

    public function log(
        ?int $userId,
        string $action,
        string $entityType,
        ?int $entityId,
        ?array $metadata = null,
        ?array $beforeValue = null,
        ?array $afterValue = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $route = null,
        ?int $tenantId = null,
    ): void {
        $this->model->newQuery()->create([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'metadata' => $metadata,
            'before_value' => $beforeValue,
            'after_value' => $afterValue,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'route' => $route,
        ]);
    }

    public function all(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery()->with('user');
        $this->applyFilters($query, $filters);

        $sort = ($filters['sort'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $query->orderBy('created_at', $sort);

        return $query->paginate($perPage);
    }

    public function getStatistics(): array
    {
        $today = Carbon::today();
        $base = fn () => $this->model->newQuery()->whereDate('created_at', '>=', $today);

        return [
            'today_total' => $base()->count(),
            'creates' => $base()->where('action', 'create')->count(),
            'updates' => $base()->where('action', 'update')->count(),
            'deletes' => $base()->where('action', 'delete')->count(),
            'failures' => $base()->where('metadata->result', 'failed')->count(),
        ];
    }

    public function exportAll(array $filters = [], int $limit = 1000): array
    {
        $query = $this->model->newQuery()->with('user');
        $this->applyFilters($query, $filters);

        return $query->orderByDesc('created_at')->limit($limit)->get()->all();
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->whereHas('user', function (Builder $u) use ($search) {
                    $u->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                });
            });
        }

        $entityFilter = $filters['entity_type'] ?? $filters['entity'] ?? null;
        if (! empty($entityFilter)) {
            $query->where('entity_type', $entityFilter);
        }

        if (! empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        if (! empty($filters['result'])) {
            if ($filters['result'] === 'success') {
                $query->where(function (Builder $q) {
                    $q->whereNull('metadata->result')
                        ->orWhere('metadata->result', 'success');
                });
            } else {
                $query->where('metadata->result', $filters['result']);
            }
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (! empty($filters['session'])) {
            $session = strtoupper($filters['session']);
            $query->where(function (Builder $q) use ($session) {
                $q->where('metadata->session_id', 'ilike', "%{$session}%");
            });
        }
    }
}
