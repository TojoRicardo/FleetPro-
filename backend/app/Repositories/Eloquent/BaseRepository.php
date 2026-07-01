<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

abstract class BaseRepository implements BaseRepositoryInterface
{
    protected Model $model;

    protected array $with = [];

    protected string $orderColumn = 'created_at';

    protected string $orderDirection = 'desc';

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    public function all(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->newQuery();
        $query = $this->applyFilters($query, $filters);

        return $query
            ->orderBy($this->orderColumn, $this->orderDirection)
            ->paginate($perPage);
    }

    public function find(int $id): ?Model
    {
        return $this->newQuery()->find($id);
    }

    public function create(array $data): Model
    {
        return $this->model->newQuery()->create($data);
    }

    public function update(int $id, array $data): Model
    {
        $record = $this->model->newQuery()->findOrFail($id);
        $record->update($data);

        return $record->fresh($this->with);
    }

    public function delete(int $id): bool
    {
        return (bool) $this->model->newQuery()->findOrFail($id)->delete();
    }

    protected function newQuery(): Builder
    {
        $query = $this->model->newQuery();

        if ($this->with !== []) {
            $query->with($this->with);
        }

        return $query;
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        if (! empty($filters['search'])) {
            $this->applySearch($query, $filters['search']);
        }

        foreach ($filters as $key => $value) {
            if (in_array($key, ['search', 'active'], true) || $value === null || $value === '') {
                continue;
            }

            if ($this->isFilterable($key)) {
                $query->where($key, $value);
            }
        }

        return $query;
    }

    protected function isFilterable(string $key): bool
    {
        return $this->model->isFillable($key)
            || in_array($key, ['status', 'vehicle_id', 'driver_id', 'type'], true);
    }

    protected function applySearch(Builder $query, string $search): void
    {
        // Override in child classes
    }
}
