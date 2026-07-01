<?php

namespace App\Listeners;

use App\Events\EntityAudited;
use Illuminate\Support\Facades\Cache;

class ClearLookupCache
{
    private const VEHICLE_STATUSES = ['', 'active', 'maintenance', 'inactive'];

    private const DRIVER_STATUSES = ['', 'available', 'on_trip', 'unavailable'];

    public function handle(EntityAudited $event): void
    {
        $entity = strtolower(class_basename($event->model));

        if ($entity === 'vehicle') {
            foreach (self::VEHICLE_STATUSES as $status) {
                Cache::forget('fleetpro.lookup.vehicles'.($status !== '' ? ".{$status}" : ''));
            }
        }

        if ($entity === 'driver') {
            foreach (self::DRIVER_STATUSES as $status) {
                Cache::forget('fleetpro.lookup.drivers'.($status !== '' ? ".{$status}" : ''));
            }
        }
    }
}
