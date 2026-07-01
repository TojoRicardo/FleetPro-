<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class Permission extends Model
{
    protected $fillable = [
        'name',
        'group',
        'description',
    ];

    public static function roleHas(string $role, string $permission): bool
    {
        return Cache::remember("permission:{$role}:{$permission}", 3600, function () use ($role, $permission) {
            return DB::table('role_permissions')
                ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
                ->where('role_permissions.role', $role)
                ->where('permissions.name', $permission)
                ->exists();
        });
    }

    public static function clearCache(): void
    {
        Cache::flush();
    }
}
