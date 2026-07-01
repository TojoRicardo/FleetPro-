<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Vehicle\StoreVehicleRequest;
use App\Http\Requests\Vehicle\UpdateVehicleRequest;
use App\Models\Vehicle;
use App\Services\VehicleService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    use ApiResponse, ResolvesPagination;

    public function __construct(private VehicleService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Vehicle::class);

        return $this->paginated(
            $this->service->list(
                $this->resolveFilters($request, ['search', 'status', 'brand']),
                $this->resolvePerPage($request)
            )
        );
    }

    public function store(StoreVehicleRequest $request)
    {
        $vehicle = $this->service->create($request->validated());

        return $this->success($vehicle, 'Vehicle created successfully.', 201);
    }

    public function show(Vehicle $vehicle)
    {
        $this->authorize('view', $vehicle);

        return $this->success($vehicle->load(['maintenanceRecords', 'activeAssignment.driver']));
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle)
    {
        $updated = $this->service->update($vehicle->id, $request->validated());

        return $this->success($updated, 'Vehicle updated successfully.');
    }

    public function destroy(Vehicle $vehicle)
    {
        $this->authorize('delete', $vehicle);
        $this->service->delete($vehicle->id);

        return $this->success(null, 'Vehicle deleted successfully.');
    }
}
