<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LookupController extends Controller
{
    use ApiResponse;

    public function vehicles(Request $request)
    {
        $status = $request->get('status');
        $cacheKey = 'fleetpro.lookup.vehicles'.($status ? ".{$status}" : '');

        $items = Cache::remember($cacheKey, 120, function () use ($status) {
            $query = \App\Models\Vehicle::query()
                ->select(['id', 'plate_number', 'brand', 'model', 'status'])
                ->orderBy('plate_number');

            if ($status) {
                $query->where('status', $status);
            }

            return $query->get();
        });

        return $this->success($items);
    }

    public function drivers(Request $request)
    {
        $status = $request->get('status') ?? $request->get('availability_status');
        $cacheKey = 'fleetpro.lookup.drivers'.($status ? ".{$status}" : '');

        $items = Cache::remember($cacheKey, 120, function () use ($status) {
            $query = \App\Models\Driver::query()
                ->select(['id', 'name', 'license_number', 'status', 'score'])
                ->orderBy('name');

            if ($status) {
                $query->where('status', $status);
            }

            return $query->get();
        });

        return $this->success($items);
    }
}
