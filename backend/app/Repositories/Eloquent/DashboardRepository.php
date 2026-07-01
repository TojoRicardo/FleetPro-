<?php

namespace App\Repositories\Eloquent;

use App\Models\Driver;
use App\Models\Maintenance;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Repositories\Contracts\DashboardRepositoryInterface;

class DashboardRepository implements DashboardRepositoryInterface
{
    public function getAggregatedStatistics(): array
    {
        return [
            'total_vehicles' => Vehicle::count(),
            'active_vehicles' => Vehicle::where('status', 'active')->count(),
            'vehicles_in_maintenance' => Vehicle::where('status', 'maintenance')->count(),
            'inactive_vehicles' => Vehicle::where('status', 'inactive')->count(),
            'total_drivers' => Driver::count(),
            'active_drivers' => Driver::where('status', 'available')->count(),
            'total_trips' => Trip::count(),
            'ongoing_trips' => Trip::where('status', 'ongoing')->count(),
            'scheduled_trips' => Trip::where('status', 'scheduled')->count(),
            'completed_trips' => Trip::where('status', 'completed')->count(),
            'cancelled_trips' => Trip::where('status', 'cancelled')->count(),
            'total_maintenance_cost' => round((float) Maintenance::sum('cost'), 2),
        ];
    }
}
