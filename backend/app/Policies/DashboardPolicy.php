<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\AuthorizesByRole;

class DashboardPolicy
{
    use AuthorizesByRole;

    public function viewStatistics(User $user): bool
    {
        if ($user->is_super_admin || $user->role->value === 'super_admin') {
            return true;
        }

        return in_array($user->role->value, ['admin', 'manager', 'mechanic'], true);
    }

    public function generateReport(User $user): bool
    {
        return $this->canManageOperations($user);
    }
}
