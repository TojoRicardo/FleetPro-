<?php

namespace App\Policies;

use App\Models\Maintenance;
use App\Models\User;
use App\Policies\Concerns\AuthorizesByRole;

class MaintenancePolicy
{
    use AuthorizesByRole;

    public function viewAny(User $user): bool
    {
        return $this->canManageMaintenance($user);
    }

    public function view(User $user, Maintenance $maintenance): bool
    {
        return $this->canManageMaintenance($user);
    }

    public function create(User $user): bool
    {
        return $this->canManageMaintenance($user);
    }

    public function update(User $user, Maintenance $maintenance): bool
    {
        return $this->canManageMaintenance($user);
    }

    public function delete(User $user, Maintenance $maintenance): bool
    {
        return $this->isAdmin($user);
    }
}
