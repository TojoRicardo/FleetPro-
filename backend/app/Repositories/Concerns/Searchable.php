<?php

namespace App\Repositories\Concerns;

use Illuminate\Database\Eloquent\Builder;

trait Searchable
{
    protected function applySearchColumns(Builder $query, string $search, array $columns): void
    {
        $query->where(function (Builder $q) use ($search, $columns) {
            foreach ($columns as $column) {
                $q->orWhere($column, 'like', "%{$search}%");
            }
        });
    }
}
