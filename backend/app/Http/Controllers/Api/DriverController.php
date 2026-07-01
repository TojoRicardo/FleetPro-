<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Driver\StoreDriverRequest;
use App\Http\Requests\Driver\UpdateDriverRequest;
use App\Models\Driver;
use App\Services\DriverService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    use ApiResponse, ResolvesPagination;

    public function __construct(private DriverService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Driver::class);

        return $this->paginated(
            $this->service->list(
                $this->resolveFilters($request, ['search', 'status']),
                $this->resolvePerPage($request)
            )
        );
    }

    public function store(StoreDriverRequest $request)
    {
        $driver = $this->service->create($request->validated());

        return $this->success($driver, 'Driver created successfully.', 201);
    }

    public function show(Driver $driver)
    {
        $this->authorize('view', $driver);

        return $this->success($driver->load(['activeAssignment.vehicle', 'trips']));
    }

    public function update(UpdateDriverRequest $request, Driver $driver)
    {
        $updated = $this->service->update($driver->id, $request->validated());

        return $this->success($updated, 'Driver updated successfully.');
    }

    public function destroy(Driver $driver)
    {
        $this->authorize('delete', $driver);
        $this->service->delete($driver->id);

        return $this->success(null, 'Driver deleted successfully.');
    }
}
