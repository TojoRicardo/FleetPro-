<?php

namespace App\Policies;

use App\Models\Driver;
use App\Models\User;
use App\Policies\Concerns\AuthorizesByRole;

class DriverPolicy
{
    use AuthorizesByRole;

    public function viewAny(User $user): bool
    {
        return $this->canManageOperations($user);
    }

    public function view(User $user, Driver $driver): bool
    {
        return $this->canManageOperations($user);
    }

    public function create(User $user): bool
    {
        return $this->canManageOperations($user);
    }

    public function update(User $user, Driver $driver): bool
    {
        return $this->canManageOperations($user);
    }

    public function delete(User $user, Driver $driver): bool
    {
        return $this->isAdmin($user);
    }
}
