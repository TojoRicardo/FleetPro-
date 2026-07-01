<?php

namespace App\Policies;

use App\Models\Assignment;
use App\Models\User;
use App\Policies\Concerns\AuthorizesByRole;

class AssignmentPolicy
{
    use AuthorizesByRole;

    public function viewAny(User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function view(User $user, Assignment $assignment): bool
    {
        return $this->isAdmin($user);
    }

    public function create(User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function update(User $user, Assignment $assignment): bool
    {
        return $this->isAdmin($user);
    }

    public function delete(User $user, Assignment $assignment): bool
    {
        return $this->isAdmin($user);
    }
}
