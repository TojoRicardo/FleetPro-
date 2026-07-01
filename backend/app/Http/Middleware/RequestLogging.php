<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestLogging
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('monitoring.request_logging')) {
            return $next($request);
        }

        $requestId = $request->headers->get('X-Request-Id') ?: (string) Str::uuid();
        $request->headers->set('X-Request-Id', $requestId);

        $start = microtime(true);
        $response = $next($request);
        $durationMs = round((microtime(true) - $start) * 1000, 2);

        $channel = config('monitoring.request_log_channel', 'requests');

        Log::channel($channel)->info('http.request', [
            'request_id' => $requestId,
            'method' => $request->method(),
            'path' => $request->path(),
            'status' => $response->getStatusCode(),
            'duration_ms' => $durationMs,
            'user_id' => $request->user()?->id,
            'tenant_id' => $request->header('X-Tenant-Id'),
            'ip' => $request->ip(),
        ]);

        $response->headers->set('X-Request-Id', $requestId);

        return $response;
    }
}
