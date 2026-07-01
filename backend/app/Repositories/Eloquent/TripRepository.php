<?php

namespace App\Repositories\Eloquent;

use App\Models\Trip;
use App\Repositories\Concerns\Searchable;
use App\Repositories\Contracts\TripRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;

class TripRepository extends BaseRepository implements TripRepositoryInterface
{
    use Searchable;

    protected array $with = ['vehicle', 'driver'];

    public function __construct(Trip $model)
    {
        parent::__construct($model);
        $this->orderColumn = 'start_time';
    }

    public function countOngoing(): int
    {
        return $this->model->newQuery()->where('status', 'ongoing')->count();
    }

    protected function applySearch(Builder $query, string $search): void
    {
        $this->applySearchColumns($query, $search, ['start_location', 'end_location']);
    }
}
