<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Assignment\StoreAssignmentRequest;
use App\Http\Requests\Assignment\UpdateAssignmentRequest;
use App\Models\Assignment;
use App\Services\AssignmentService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    use ApiResponse, ResolvesPagination;

    public function __construct(private AssignmentService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Assignment::class);

        return $this->paginated(
            $this->service->list(
                $this->resolveFilters($request, ['vehicle_id', 'driver_id', 'active']),
                $this->resolvePerPage($request)
            )
        );
    }

    public function store(StoreAssignmentRequest $request)
    {
        $assignment = $this->service->assign($request->validated());

        return $this->success($assignment, 'Driver assigned successfully.', 201);
    }

    public function show(Assignment $assignment)
    {
        $this->authorize('view', $assignment);

        return $this->success($assignment->load(['vehicle', 'driver']));
    }

    public function unassign(Assignment $assignment)
    {
        $this->authorize('update', $assignment);
        $updated = $this->service->unassign($assignment->id);

        return $this->success($updated, 'Driver unassigned successfully.');
    }

    public function update(UpdateAssignmentRequest $request, Assignment $assignment)
    {
        $updated = $this->service->update($assignment->id, $request->validated());

        return $this->success($updated, 'Assignment updated successfully.');
    }

    public function destroy(Assignment $assignment)
    {
        $this->authorize('delete', $assignment);
        $this->service->delete($assignment->id);

        return $this->success(null, 'Assignment deleted successfully.');
    }
}
