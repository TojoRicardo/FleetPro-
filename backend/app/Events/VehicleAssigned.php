<?php

namespace App\Events;

use App\Models\Assignment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VehicleAssigned implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Assignment $assignment) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('tenant.'.$this->assignment->tenant_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'vehicle.assigned';
    }

    public function broadcastWith(): array
    {
        return [
            'assignment_id' => $this->assignment->id,
            'vehicle_id' => $this->assignment->vehicle_id,
            'driver_id' => $this->assignment->driver_id,
        ];
    }
}
