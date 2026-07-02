<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Support\AvatarUrl;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Sanctum\NewAccessToken;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'tenant_id',
        'name',
        'username',
        'email',
        'phone',
        'job_title',
        'department',
        'avatar_url',
        'password',
        'role',
        'status',
        'last_login_at',
        'is_super_admin',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'role' => UserRole::class,
            'last_login_at' => 'datetime',
            'is_super_admin' => 'boolean',
        ];
    }

    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => AvatarUrl::normalize($value),
        );
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function getIsSuperAdminAttribute(): bool
    {
        return $this->role === UserRole::SuperAdmin
            || ($this->attributes['is_super_admin'] ?? false);
    }

    public function isAdmin(): bool
    {
        return $this->role->isAdmin();
    }

    public function isManager(): bool
    {
        return $this->role->isManager();
    }

    public function tokenAbilities(): array
    {
        return $this->role->tokenAbilities();
    }

    public function createAuthToken(string $name = 'auth-token'): NewAccessToken
    {
        $expiration = config('sanctum.expiration');

        return $this->createToken(
            $name,
            $this->tokenAbilities(),
            $expiration ? now()->addMinutes((int) $expiration) : null
        );
    }

    public function revokeAllTokens(): void
    {
        $this->tokens()->delete();
    }
}
