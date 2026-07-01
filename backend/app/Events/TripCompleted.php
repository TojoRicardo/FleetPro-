<?php

namespace App\Events;

use App\Models\Trip;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TripCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Trip $trip) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('tenant.'.$this->trip->tenant_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'trip.completed';
    }

    public function broadcastWith(): array
    {
        return [
            'trip_id' => $this->trip->id,
            'vehicle_id' => $this->trip->vehicle_id,
            'driver_id' => $this->trip->driver_id,
            'distance' => $this->trip->distance,
        ];
    }
}
