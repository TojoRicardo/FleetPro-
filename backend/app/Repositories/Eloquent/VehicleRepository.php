<?php

namespace App\Repositories\Eloquent;

use App\Models\Vehicle;
use App\Repositories\Concerns\Searchable;
use App\Repositories\Contracts\VehicleRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;

class VehicleRepository extends BaseRepository implements VehicleRepositoryInterface
{
    use Searchable;

    public function __construct(Vehicle $model)
    {
        parent::__construct($model);
    }

    public function countByStatus(string $status): int
    {
        return $this->model->newQuery()->where('status', $status)->count();
    }

    public function getTotalCount(): int
    {
        return $this->model->newQuery()->count();
    }

    protected function applySearch(Builder $query, string $search): void
    {
        $this->applySearchColumns($query, $search, ['plate_number', 'brand', 'model']);
    }
}
