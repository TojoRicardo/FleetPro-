<?php

namespace App\Services;

use App\Models\Driver;
use App\Models\Vehicle;
use App\Repositories\Contracts\TripRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class TripService
{
    public function __construct(private TripRepositoryInterface $repository) {}

    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->all($filters, $perPage);
    }

    public function find(int $id): ?Model
    {
        return $this->repository->find($id);
    }

    public function create(array $data): Model
    {
        $vehicle = Vehicle::findOrFail($data['vehicle_id']);
        $driver = Driver::findOrFail($data['driver_id']);

        if ($vehicle->status !== 'active') {
            throw ValidationException::withMessages([
                'vehicle_id' => ['Vehicle is not available for trips.'],
            ]);
        }

        if ($driver->status !== 'available') {
            throw ValidationException::withMessages([
                'driver_id' => ['Driver is not available.'],
            ]);
        }

        $status = $data['status'] ?? 'scheduled';
        $data['status'] = $status;

        $trip = $this->repository->create($data);

        if ($status === 'ongoing') {
            $driver->update(['status' => 'on_trip']);
            event(new \App\Events\TripStarted($trip));
        }

        return $trip->load(['vehicle', 'driver']);
    }

    public function update(int $id, array $data): Model
    {
        $trip = $this->repository->find($id);

        if (! $trip) {
            abort(404);
        }

        $oldDriverId = $trip->driver_id;
        $oldStatus = $trip->status;

        $updated = $this->repository->update($id, $data);

        $newStatus = $data['status'] ?? $updated->status;
        $newDriverId = $data['driver_id'] ?? $updated->driver_id;

        if ((int) $oldDriverId !== (int) $newDriverId && in_array($oldStatus, ['ongoing'], true)) {
            Driver::where('id', $oldDriverId)->update(['status' => 'available']);
        }

        $driver = Driver::find($newDriverId);

        if ($driver) {
            if ($newStatus === 'ongoing' && $oldStatus !== 'ongoing') {
                $driver->update(['status' => 'on_trip']);
                event(new \App\Events\TripStarted($updated));
            } elseif ($newStatus === 'completed' && $oldStatus !== 'completed') {
                $driver->update(['status' => 'available']);
                event(new \App\Events\TripCompleted($updated));
            } elseif (in_array($newStatus, ['cancelled', 'scheduled'], true)) {
                $driver->update(['status' => 'available']);
            }
        }

        return $updated->load(['vehicle', 'driver']);
    }

    public function delete(int $id): bool
    {
        $trip = $this->repository->find($id);

        if ($trip && $trip->status === 'ongoing') {
            Driver::where('id', $trip->driver_id)->update(['status' => 'available']);
        }

        return $this->repository->delete($id);
    }
}
