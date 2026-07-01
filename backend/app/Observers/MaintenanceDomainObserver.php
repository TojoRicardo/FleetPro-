<?php

namespace App\Observers;

use App\Events\MaintenanceScheduled;
use App\Models\Maintenance;

class MaintenanceDomainObserver
{
    public function created(Maintenance $maintenance): void
    {
        event(new MaintenanceScheduled($maintenance));
    }
}
