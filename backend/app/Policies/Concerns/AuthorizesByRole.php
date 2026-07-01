<?php

namespace App\Policies\Concerns;

use App\Enums\UserRole;
use App\Models\User;

trait AuthorizesByRole
{
    protected function isAdmin(User $user): bool
    {
        return $user->isAdmin();
    }

    protected function isManager(User $user): bool
    {
        return $user->isManager();
    }

    protected function canManageOperations(User $user): bool
    {
        return $user->isAdmin() || $user->role === UserRole::Manager;
    }

    protected function canManageMaintenance(User $user): bool
    {
        return $user->isAdmin() || $user->role === UserRole::Mechanic;
    }

    protected function belongsToUserTenant(User $user, object $model): bool
    {
        if ($user->is_super_admin) {
            return true;
        }

        $tenantId = $model->tenant_id ?? null;

        return $tenantId !== null && $tenantId === $user->tenant_id;
    }
}
