<?php

namespace App\Providers;

use App\Events\EntityAudited;
use App\Listeners\LogEntityAudit;
use App\Listeners\SendEntityNotification;
use App\Listeners\UpdateDashboardCache;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        EntityAudited::class => [
            LogEntityAudit::class,
            UpdateDashboardCache::class,
            \App\Listeners\ClearLookupCache::class,
        ],
    ];

    protected $subscribe = [
        SendEntityNotification::class,
    ];

    public function boot(): void
    {
        //
    }
}
