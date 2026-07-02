<?php

namespace App\Providers;

use App\Models\Assignment;
use App\Models\AuditLog;
use App\Models\Driver;
use App\Models\Maintenance;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Policies\AssignmentPolicy;
use App\Policies\AuditLogPolicy;
use App\Policies\DashboardPolicy;
use App\Policies\DriverPolicy;
use App\Policies\MaintenancePolicy;
use App\Policies\TripPolicy;
use App\Policies\VehiclePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Vehicle::class => VehiclePolicy::class,
        Driver::class => DriverPolicy::class,
        Trip::class => TripPolicy::class,
        Maintenance::class => MaintenancePolicy::class,
        Assignment::class => AssignmentPolicy::class,
        AuditLog::class => AuditLogPolicy::class,
    ];

    public function boot(): void
    {
        Gate::define('view-dashboard', [DashboardPolicy::class, 'viewStatistics']);
    }
}
