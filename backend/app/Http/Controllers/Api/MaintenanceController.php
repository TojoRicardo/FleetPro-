<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Maintenance\StoreMaintenanceRequest;
use App\Http\Requests\Maintenance\UpdateMaintenanceRequest;
use App\Models\Maintenance;
use App\Services\MaintenanceService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    use ApiResponse, ResolvesPagination;

    public function __construct(private MaintenanceService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Maintenance::class);

        return $this->paginated(
            $this->service->list(
                $this->resolveFilters($request, ['search', 'vehicle_id', 'type']),
                $this->resolvePerPage($request)
            )
        );
    }

    public function store(StoreMaintenanceRequest $request)
    {
        $maintenance = $this->service->create($request->validated());

        return $this->success($maintenance, 'Maintenance record created successfully.', 201);
    }

    public function show(Maintenance $maintenance)
    {
        $this->authorize('view', $maintenance);

        return $this->success($maintenance->load('vehicle'));
    }

    public function update(UpdateMaintenanceRequest $request, Maintenance $maintenance)
    {
        $updated = $this->service->update($maintenance->id, $request->validated());

        return $this->success($updated, 'Maintenance record updated successfully.');
    }

    public function destroy(Maintenance $maintenance)
    {
        $this->authorize('delete', $maintenance);
        $this->service->delete($maintenance->id);

        return $this->success(null, 'Maintenance record deleted successfully.');
    }
}
