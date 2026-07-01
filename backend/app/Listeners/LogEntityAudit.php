<?php

namespace App\Listeners;

use App\Events\EntityAudited;
use App\Repositories\Contracts\AuditLogRepositoryInterface;
use App\Services\TenantContext;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class LogEntityAudit
{
    public function __construct(
        private AuditLogRepositoryInterface $auditLogRepository,
        private TenantContext $tenantContext,
    ) {}

    public function handle(EntityAudited $event): void
    {
        $model = $event->model;
        $entityType = strtolower(class_basename($model));

        $this->auditLogRepository->log(
            Auth::id(),
            $event->action,
            $entityType,
            $model->getKey(),
            $event->after ?? $this->filterAttributes($model->toArray()),
            $event->before,
            $event->after,
            Request::ip(),
            Request::userAgent(),
            Request::path(),
            $model->tenant_id ?? $this->tenantContext->id()
        );
    }

    private function filterAttributes(array $attributes): array
    {
        $skip = ['created_at', 'updated_at', 'deleted_at', 'password', 'remember_token'];

        return array_filter(
            array_diff_key($attributes, array_flip($skip)),
            fn ($value) => $value !== null && $value !== ''
        );
    }
}
