<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case Manager = 'manager';
    case Mechanic = 'mechanic';
    case Driver = 'driver';

    public function isSuperAdmin(): bool
    {
        return $this === self::SuperAdmin;
    }

    public function isAdmin(): bool
    {
        return in_array($this, [self::SuperAdmin, self::Admin], true);
    }

    public function isManager(): bool
    {
        return in_array($this, [self::SuperAdmin, self::Admin, self::Manager], true);
    }

    public function isMechanic(): bool
    {
        return in_array($this, [self::SuperAdmin, self::Admin, self::Manager, self::Mechanic], true);
    }

    public function tokenAbilities(): array
    {
        return match ($this) {
            self::SuperAdmin, self::Admin => ['*'],
            self::Manager => [
                'dashboard:read',
                'vehicles:read', 'vehicles:write',
                'drivers:read', 'drivers:write',
                'trips:read', 'trips:write',
            ],
            self::Mechanic => [
                'dashboard:read',
                'maintenance:read', 'maintenance:write',
                'vehicles:read',
            ],
            self::Driver => [
                'dashboard:read',
                'trips:read',
            ],
        };
    }

    public static function assignableOnRegistration(): array
    {
        return [self::Manager->value, self::Mechanic->value, self::Driver->value];
    }
}
