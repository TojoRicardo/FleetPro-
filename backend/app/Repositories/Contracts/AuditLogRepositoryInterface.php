<?php

namespace App\Repositories\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;

interface AuditLogRepositoryInterface
{
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
    ): void;

    public function all(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function getStatistics(): array;

    /** @return array<int, \App\Models\AuditLog> */
    public function exportAll(array $filters = [], int $limit = 1000): array;
}
