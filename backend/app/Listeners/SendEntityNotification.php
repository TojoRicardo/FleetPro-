<?php

namespace App\Listeners;

use App\Domain\Analytics\AnalyticsEventService;
use App\Domain\Notification\NotificationService;
use App\Events\MaintenanceScheduled;
use App\Events\TripCompleted;
use App\Events\TripStarted;
use App\Events\UserLoggedIn;
use App\Events\VehicleAssigned;
use App\Events\VehicleCreated;
use App\Events\VehicleUpdated;
use App\Jobs\SendEmailNotification;
use App\Repositories\Contracts\AuditLogRepositoryInterface;
use Illuminate\Support\Facades\Request;

class SendEntityNotification
{
    public function __construct(
        private NotificationService $notificationService,
        private AnalyticsEventService $analyticsEventService,
        private AuditLogRepositoryInterface $auditLogRepository,
    ) {}

    public function handleVehicleCreated(VehicleCreated $event): void
    {
        $vehicle = $event->vehicle;
        $this->track('vehicle.created', ['vehicle_id' => $vehicle->id], $vehicle->tenant_id);
        $this->notificationService->sendToTenantAdmins(
            'vehicle.created',
            'New Vehicle Added',
            "Vehicle {$vehicle->plate_number} ({$vehicle->brand} {$vehicle->model}) was added to the fleet."
        );
    }

    public function handleVehicleUpdated(VehicleUpdated $event): void
    {
        $this->track('vehicle.updated', ['vehicle_id' => $event->vehicle->id], $event->vehicle->tenant_id);
    }

    public function handleVehicleAssigned(VehicleAssigned $event): void
    {
        $assignment = $event->assignment->load(['vehicle', 'driver']);
        $this->track('assignment.created', ['assignment_id' => $assignment->id], $assignment->tenant_id);
        $this->notificationService->sendToTenantAdmins(
            'assignment.changed',
            'Vehicle Assigned',
            "Vehicle {$assignment->vehicle->plate_number} assigned to {$assignment->driver->name}."
        );
        SendEmailNotification::dispatch('assignment.changed', 'Vehicle Assignment Update', "Vehicle {$assignment->vehicle->plate_number} assigned.");
    }

    public function handleTripStarted(TripStarted $event): void
    {
        $trip = $event->trip->load(['vehicle', 'driver']);
        $this->track('trip.started', ['trip_id' => $trip->id], $trip->tenant_id);
        $this->notificationService->sendToTenantAdmins('trip.started', 'Trip Started', "Trip from {$trip->start_location} started.");
    }

    public function handleTripCompleted(TripCompleted $event): void
    {
        $trip = $event->trip->load(['vehicle', 'driver']);
        $this->track('trip.completed', ['trip_id' => $trip->id, 'distance' => $trip->distance], $trip->tenant_id);
        $this->notificationService->sendToTenantAdmins('trip.completed', 'Trip Completed', "Trip completed. Distance: {$trip->distance} km.");
    }

    public function handleMaintenanceScheduled(MaintenanceScheduled $event): void
    {
        $maintenance = $event->maintenance->load('vehicle');
        $this->track('maintenance.scheduled', ['maintenance_id' => $maintenance->id], $maintenance->tenant_id);
        $this->notificationService->sendToTenantAdmins(
            'maintenance.due',
            'Maintenance Scheduled',
            "{$maintenance->type} scheduled for {$maintenance->vehicle->plate_number}."
        );
    }

    public function handleUserLoggedIn(UserLoggedIn $event): void
    {
        $this->auditLogRepository->log(
            $event->user->id,
            'login',
            'user',
            $event->user->id,
            ['email' => $event->user->email],
            null,
            null,
            $event->ipAddress ?? Request::ip(),
            Request::userAgent(),
            Request::path(),
            $event->user->tenant_id
        );

        if ($event->user->tenant_id) {
            $this->track('user.login', ['user_id' => $event->user->id], $event->user->tenant_id);
        }
    }

    private function track(string $type, array $payload, ?int $tenantId = null): void
    {
        $this->analyticsEventService->track($type, $payload, $tenantId);
    }

    public function subscribe($events): array
    {
        return [
            VehicleCreated::class => 'handleVehicleCreated',
            VehicleUpdated::class => 'handleVehicleUpdated',
            VehicleAssigned::class => 'handleVehicleAssigned',
            TripStarted::class => 'handleTripStarted',
            TripCompleted::class => 'handleTripCompleted',
            MaintenanceScheduled::class => 'handleMaintenanceScheduled',
            UserLoggedIn::class => 'handleUserLoggedIn',
        ];
    }
}
