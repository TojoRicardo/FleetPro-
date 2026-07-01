<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'vehicle_limit',
        'price_monthly',
        'price_yearly',
        'price_per_vehicle',
        'max_vehicles',
        'max_users',
        'max_drivers',
        'features',
        'is_active',
        'stripe_price_id',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'price_monthly' => 'decimal:2',
            'price_yearly' => 'decimal:2',
            'price_per_vehicle' => 'decimal:2',
            'features' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }

    public function getEffectivePrice(): float
    {
        return (float) ($this->price ?: $this->price_monthly);
    }

    public function getEffectiveVehicleLimit(): int
    {
        return (int) ($this->vehicle_limit ?: $this->max_vehicles);
    }

    public function isFree(): bool
    {
        return $this->slug === 'free';
    }
}
