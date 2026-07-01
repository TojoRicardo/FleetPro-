<?php

namespace App\Http\Middleware;

use App\Domain\Billing\BillingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforcePlanLimits
{
    public function __construct(private BillingService $billingService) {}

    public function handle(Request $request, Closure $next, string $resource): Response
    {
        $user = $request->user();

        if ($user?->is_super_admin) {
            return $next($request);
        }

        if ($request->isMethod('POST') && ! $this->billingService->canCreate($resource)) {
            return response()->json([
                'success' => false,
                'message' => "Your current plan limit for {$resource} has been reached. Please upgrade your subscription.",
            ], 402);
        }

        return $next($request);
    }
}
