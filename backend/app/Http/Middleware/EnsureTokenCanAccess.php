<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTokenCanAccess
{
    public function handle(Request $request, Closure $next, string $ability): Response
    {
        $user = $request->user();

        if (! $user || (! $user->tokenCan($ability) && ! $user->tokenCan('*'))) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Token lacks required permission.',
            ], 403);
        }

        return $next($request);
    }
}
