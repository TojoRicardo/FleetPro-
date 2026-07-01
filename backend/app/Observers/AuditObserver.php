<?php

namespace App\Observers;

use App\Events\EntityAudited;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class AuditObserver
{
    /** @var array<int, array<string, mixed>> */
    private static array $auditBefore = [];

    public function created(Model $model): void
    {
        event(new EntityAudited('create', $model, null, $model->toArray()));
    }

    public function updating(Model $model): void
    {
        self::$auditBefore[spl_object_id($model)] = $model->getOriginal();
    }

    public function updated(Model $model): void
    {
        $objectId = spl_object_id($model);
        $before = self::$auditBefore[$objectId] ?? $model->getOriginal();
        unset(self::$auditBefore[$objectId]);

        event(new EntityAudited(
            'update',
            $model,
            $this->filterAuditAttributes($before),
            $this->filterAuditAttributes($model->toArray())
        ));
    }

    public function deleted(Model $model): void
    {
        event(new EntityAudited('delete', $model, $model->toArray(), null));
    }

    private function filterAuditAttributes(array $attributes): array
    {
        $skip = ['created_at', 'updated_at', 'deleted_at', 'password', 'remember_token'];

        return array_filter(
            array_diff_key($attributes, array_flip($skip)),
            fn ($value) => $value !== null && $value !== ''
        );
    }
}
