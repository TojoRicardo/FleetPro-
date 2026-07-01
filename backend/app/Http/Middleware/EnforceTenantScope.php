<?php

namespace App\Http\Middleware;

use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceTenantScope
{
    public function __construct(private TenantContext $tenantContext) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->is_super_admin && ! $request->header('X-Tenant-Id')) {
            return $next($request);
        }

        if (! $this->tenantContext->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant context could not be resolved.',
            ], 403);
        }

        $tenant = $this->tenantContext->get();

        if ($tenant && $tenant->status === 'suspended') {
            return response()->json([
                'success' => false,
                'message' => 'This organization has been suspended. Please contact support.',
            ], 403);
        }

        return $next($request);
    }
}
