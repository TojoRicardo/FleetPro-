<?php

namespace App\Services;

use App\Models\Driver;
use App\Models\Maintenance;
use App\Models\Vehicle;
use App\Repositories\Contracts\MaintenanceRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

class MaintenanceService
{
    public function __construct(private MaintenanceRepositoryInterface $repository) {}

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
        $maintenance = $this->repository->create($data);

        Vehicle::where('id', $data['vehicle_id'])->update(['status' => 'maintenance']);

        return $maintenance->load('vehicle');
    }

    public function update(int $id, array $data): Model
    {
        $record = $this->repository->find($id);

        if (! $record) {
            abort(404);
        }

        $oldVehicleId = $record->vehicle_id;
        $updated = $this->repository->update($id, $data);

        if (isset($data['vehicle_id']) && (int) $data['vehicle_id'] !== (int) $oldVehicleId) {
            $this->syncVehicleMaintenanceStatus($oldVehicleId);
            Vehicle::where('id', $data['vehicle_id'])->update(['status' => 'maintenance']);
        }

        return $updated->load('vehicle');
    }

    public function delete(int $id): bool
    {
        $record = $this->repository->find($id);

        if (! $record) {
            abort(404);
        }

        $vehicleId = $record->vehicle_id;
        $deleted = $this->repository->delete($id);

        if ($deleted) {
            $this->syncVehicleMaintenanceStatus($vehicleId);
        }

        return $deleted;
    }

    private function syncVehicleMaintenanceStatus(int $vehicleId): void
    {
        $hasRecords = Maintenance::where('vehicle_id', $vehicleId)->exists();

        if (! $hasRecords) {
            Vehicle::where('id', $vehicleId)->where('status', 'maintenance')->update(['status' => 'active']);
        }
    }
}
