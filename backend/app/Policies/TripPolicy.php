<?php

namespace App\Policies;

use App\Models\Trip;
use App\Models\User;
use App\Policies\Concerns\AuthorizesByRole;

class TripPolicy
{
    use AuthorizesByRole;

    public function viewAny(User $user): bool
    {
        return $this->canManageOperations($user);
    }

    public function view(User $user, Trip $trip): bool
    {
        return $this->canManageOperations($user);
    }

    public function create(User $user): bool
    {
        return $this->canManageOperations($user);
    }

    public function update(User $user, Trip $trip): bool
    {
        return $this->canManageOperations($user);
    }

    public function delete(User $user, Trip $trip): bool
    {
        return $this->isAdmin($user);
    }
}
