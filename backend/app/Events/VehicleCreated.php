<?php

namespace App\Events;

use App\Models\Vehicle;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VehicleCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Vehicle $vehicle) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('tenant.'.$this->vehicle->tenant_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'vehicle.created';
    }

    public function broadcastWith(): array
    {
        return [
            'vehicle' => $this->vehicle->only(['id', 'plate_number', 'brand', 'model', 'status']),
        ];
    }
}
