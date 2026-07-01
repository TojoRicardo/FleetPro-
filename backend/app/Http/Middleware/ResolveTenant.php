<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function __construct(private TenantContext $tenantContext) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($user->is_super_admin && $request->header('X-Tenant-Id')) {
            $tenant = Tenant::find($request->header('X-Tenant-Id'));

            if ($tenant) {
                $this->tenantContext->set($tenant);
            }
        } elseif ($user->tenant_id) {
            $tenant = Tenant::find($user->tenant_id);

            if ($tenant) {
                $this->tenantContext->set($tenant);
            }
        }

        return $next($request);
    }
}
