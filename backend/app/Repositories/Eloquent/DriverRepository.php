<?php

namespace App\Repositories\Eloquent;

use App\Models\Driver;
use App\Repositories\Concerns\Searchable;
use App\Repositories\Contracts\DriverRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;

class DriverRepository extends BaseRepository implements DriverRepositoryInterface
{
    use Searchable;

    public function __construct(Driver $model)
    {
        parent::__construct($model);
    }

    public function getTotalCount(): int
    {
        return $this->model->newQuery()->count();
    }

    protected function applySearch(Builder $query, string $search): void
    {
        $this->applySearchColumns($query, $search, ['name', 'license_number', 'phone']);
    }
}
