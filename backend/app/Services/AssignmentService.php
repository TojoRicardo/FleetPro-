<?php

namespace App\Services;

use App\Models\Driver;
use App\Models\Vehicle;
use App\Repositories\Contracts\AssignmentRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class AssignmentService
{
    public function __construct(private AssignmentRepositoryInterface $repository) {}

    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->all($filters, $perPage);
    }

    public function find(int $id): ?Model
    {
        return $this->repository->find($id);
    }

    public function assign(array $data): Model
    {
        $vehicle = Vehicle::findOrFail($data['vehicle_id']);
        $driver = Driver::findOrFail($data['driver_id']);

        if ($driver->status !== 'available') {
            throw ValidationException::withMessages([
                'driver_id' => ['Driver is not available for assignment.'],
            ]);
        }

        if ($vehicle->status !== 'active') {
            throw ValidationException::withMessages([
                'vehicle_id' => ['Vehicle is not available for assignment.'],
            ]);
        }

        if ($this->repository->findActiveByVehicle($vehicle->id)) {
            throw ValidationException::withMessages([
                'vehicle_id' => ['Vehicle already has an active assignment.'],
            ]);
        }

        if ($this->repository->findActiveByDriver($driver->id)) {
            throw ValidationException::withMessages([
                'driver_id' => ['Driver already has an active assignment.'],
            ]);
        }

        $assignment = $this->repository->create([
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'assigned_at' => now(),
            'status' => 'active',
        ]);

        $assignment = $assignment->load(['vehicle', 'driver']);

        event(new \App\Events\VehicleAssigned($assignment));

        return $assignment;
    }

    public function unassign(int $id): Model
    {
        $assignment = $this->repository->find($id);

        if (! $assignment || ! $assignment->isActive()) {
            throw ValidationException::withMessages([
                'assignment' => ['Assignment is not active.'],
            ]);
        }

        return $this->repository->update($id, [
            'unassigned_at' => now(),
            'status' => 'ended',
        ])->load(['vehicle', 'driver']);
    }

    public function update(int $id, array $data): Model
    {
        $assignment = $this->repository->find($id);

        if (! $assignment) {
            abort(404);
        }

        if (isset($data['driver_id']) && $assignment->isActive()) {
            $driver = Driver::findOrFail($data['driver_id']);

            if ($this->repository->findActiveByDriver($driver->id)) {
                throw ValidationException::withMessages([
                    'driver_id' => ['Driver already has an active assignment.'],
                ]);
            }
        }

        return $this->repository->update($id, $data)->load(['vehicle', 'driver']);
    }

    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }
}
