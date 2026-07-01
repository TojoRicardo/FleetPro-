<?php

namespace App\Repositories\Eloquent;

use App\Models\Maintenance;
use App\Repositories\Concerns\Searchable;
use App\Repositories\Contracts\MaintenanceRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;

class MaintenanceRepository extends BaseRepository implements MaintenanceRepositoryInterface
{
    use Searchable;

    protected array $with = ['vehicle'];

    public function __construct(Maintenance $model)
    {
        parent::__construct($model);
        $this->orderColumn = 'maintenance_date';
    }

    public function getTotalCost(): float
    {
        return (float) $this->model->newQuery()->sum('cost');
    }

    protected function applySearch(Builder $query, string $search): void
    {
        $this->applySearchColumns($query, $search, ['type', 'description']);
    }
}
