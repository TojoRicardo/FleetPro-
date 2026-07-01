<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Driver extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'license_number',
        'phone',
        'status',
        'score',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:1',
        ];
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function activeAssignment()
    {
        return $this->hasOne(Assignment::class)->where('status', 'active')->latest('assigned_at');
    }

    public function vehicles(): BelongsToMany
    {
        return $this->belongsToMany(Vehicle::class, 'assignments')
            ->withPivot('assigned_at', 'unassigned_at', 'status')
            ->withTimestamps();
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }
}
