<?php

namespace App\Services;

use App\Models\Tenant;

class TenantContext
{
    private ?Tenant $tenant = null;

    private bool $scoped = true;

    public function set(Tenant $tenant): void
    {
        $this->tenant = $tenant;
    }

    public function setId(int $tenantId): void
    {
        $this->tenant = Tenant::find($tenantId);
    }

    public function get(): ?Tenant
    {
        return $this->tenant;
    }

    public function id(): ?int
    {
        return $this->tenant?->id;
    }

    public function forget(): void
    {
        $this->tenant = null;
    }

    public function withoutScope(callable $callback): mixed
    {
        $previous = $this->scoped;
        $this->scoped = false;

        try {
            return $callback();
        } finally {
            $this->scoped = $previous;
        }
    }

    public function isScoped(): bool
    {
        return $this->scoped && $this->tenant !== null;
    }
}
