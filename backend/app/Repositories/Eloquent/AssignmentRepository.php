<?php

namespace App\Repositories\Eloquent;

use App\Models\Assignment;
use App\Repositories\Contracts\AssignmentRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;

class AssignmentRepository extends BaseRepository implements AssignmentRepositoryInterface
{
    protected array $with = ['vehicle', 'driver'];

    public function __construct(Assignment $model)
    {
        parent::__construct($model);
        $this->orderColumn = 'assigned_at';
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        $query = parent::applyFilters($query, $filters);

        if (array_key_exists('active', $filters) && $filters['active'] !== null && $filters['active'] !== '') {
            if (filter_var($filters['active'], FILTER_VALIDATE_BOOLEAN)) {
                $query->whereNull('unassigned_at');
            } else {
                $query->whereNotNull('unassigned_at');
            }
        }

        return $query;
    }

    public function findActiveByVehicle(int $vehicleId)
    {
        return $this->model->newQuery()
            ->where('vehicle_id', $vehicleId)
            ->whereNull('unassigned_at')
            ->first();
    }

    public function findActiveByDriver(int $driverId)
    {
        return $this->model->newQuery()
            ->where('driver_id', $driverId)
            ->whereNull('unassigned_at')
            ->first();
    }
}
