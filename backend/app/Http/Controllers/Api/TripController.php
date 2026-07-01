<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Trip\StoreTripRequest;
use App\Http\Requests\Trip\UpdateTripRequest;
use App\Models\Trip;
use App\Services\TripService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TripController extends Controller
{
    use ApiResponse, ResolvesPagination;

    public function __construct(private TripService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Trip::class);

        return $this->paginated(
            $this->service->list(
                $this->resolveFilters($request, ['search', 'status', 'vehicle_id', 'driver_id']),
                $this->resolvePerPage($request)
            )
        );
    }

    public function store(StoreTripRequest $request)
    {
        $trip = $this->service->create($request->validated());

        return $this->success($trip, 'Trip created successfully.', 201);
    }

    public function show(Trip $trip)
    {
        $this->authorize('view', $trip);

        return $this->success($trip->load(['vehicle', 'driver']));
    }

    public function update(UpdateTripRequest $request, Trip $trip)
    {
        $updated = $this->service->update($trip->id, $request->validated());

        return $this->success($updated, 'Trip updated successfully.');
    }

    public function destroy(Trip $trip)
    {
        $this->authorize('delete', $trip);
        $this->service->delete($trip->id);

        return $this->success(null, 'Trip deleted successfully.');
    }
}
