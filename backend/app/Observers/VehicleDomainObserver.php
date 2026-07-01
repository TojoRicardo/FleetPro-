<?php

namespace App\Observers;

use App\Events\VehicleCreated;
use App\Events\VehicleUpdated;
use App\Models\Vehicle;

class VehicleDomainObserver
{
    public function created(Vehicle $vehicle): void
    {
        event(new VehicleCreated($vehicle));
    }

    public function updated(Vehicle $vehicle): void
    {
        event(new VehicleUpdated($vehicle));
    }
}
