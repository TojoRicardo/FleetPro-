<?php

namespace App\Traits;

use App\Models\Tenant;
use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            $context = app(TenantContext::class);

            if ($context->isScoped()) {
                $builder->where(
                    $builder->getModel()->getTable().'.tenant_id',
                    $context->id()
                );
            }
        });

        static::creating(function (Model $model) {
            if (! $model->tenant_id) {
                $context = app(TenantContext::class);
                if ($context->id()) {
                    $model->tenant_id = $context->id();
                }
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
