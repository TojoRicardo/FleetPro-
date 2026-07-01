<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'plate_number',
        'brand',
        'model',
        'year',
        'mileage',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'mileage' => 'integer',
        ];
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(Maintenance::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function activeAssignment()
    {
        return $this->hasOne(Assignment::class)->whereNull('unassigned_at')->latest('assigned_at');
    }

    public function drivers(): BelongsToMany
    {
        return $this->belongsToMany(Driver::class, 'assignments')
            ->withPivot('assigned_at', 'unassigned_at')
            ->withTimestamps();
    }
}
