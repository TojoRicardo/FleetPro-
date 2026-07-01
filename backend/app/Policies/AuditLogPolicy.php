<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\User;
use App\Policies\Concerns\AuthorizesByRole;

class AuditLogPolicy
{
    use AuthorizesByRole;

    public function viewAny(User $user): bool
    {
        return $this->canManageOperations($user);
    }
}
