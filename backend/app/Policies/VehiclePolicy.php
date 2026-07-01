<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Vehicle;
use App\Policies\Concerns\AuthorizesByRole;

class VehiclePolicy
{
    use AuthorizesByRole;

    public function viewAny(User $user): bool
    {
        return $this->canManageOperations($user) || $user->role === UserRole::Mechanic;
    }

    public function view(User $user, Vehicle $vehicle): bool
    {
        return $this->belongsToUserTenant($user, $vehicle) && $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->canManageOperations($user);
    }

    public function update(User $user, Vehicle $vehicle): bool
    {
        return $this->belongsToUserTenant($user, $vehicle) && $this->canManageOperations($user);
    }

    public function delete(User $user, Vehicle $vehicle): bool
    {
        return $this->belongsToUserTenant($user, $vehicle) && $this->isAdmin($user);
    }
}
