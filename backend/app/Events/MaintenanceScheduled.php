<?php

namespace App\Events;

use App\Models\Maintenance;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MaintenanceScheduled implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Maintenance $maintenance) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('tenant.'.$this->maintenance->tenant_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'maintenance.scheduled';
    }

    public function broadcastWith(): array
    {
        return [
            'maintenance_id' => $this->maintenance->id,
            'vehicle_id' => $this->maintenance->vehicle_id,
            'type' => $this->maintenance->type,
            'maintenance_date' => $this->maintenance->maintenance_date?->toDateString(),
        ];
    }
}
