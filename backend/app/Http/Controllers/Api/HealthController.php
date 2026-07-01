<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

class HealthController extends Controller
{
    use ApiResponse;

    public function liveness()
    {
        return $this->success([
            'status' => 'ok',
            'service' => config('app.name'),
            'environment' => config('app.env'),
            'timestamp' => now()->toIso8601String(),
        ], 'Service is alive.');
    }

    public function readiness()
    {
        $checks = [];
        $healthy = true;

        if (config('monitoring.health.check_database')) {
            try {
                DB::connection()->getPdo();
                $checks['database'] = ['status' => 'ok'];
            } catch (\Throwable $e) {
                $healthy = false;
                $checks['database'] = ['status' => 'fail', 'message' => 'Database unreachable'];
            }
        }

        if (config('monitoring.health.check_cache')) {
            try {
                Cache::put('health_check', true, 10);
                $checks['cache'] = Cache::get('health_check') ? ['status' => 'ok'] : ['status' => 'fail'];
            } catch (\Throwable $e) {
                $healthy = false;
                $checks['cache'] = ['status' => 'fail', 'message' => 'Cache unreachable'];
            }
        }

        if (config('monitoring.health.check_queue')) {
            try {
                $checks['queue'] = ['status' => 'ok', 'connection' => config('queue.default')];
            } catch (\Throwable $e) {
                $healthy = false;
                $checks['queue'] = ['status' => 'fail'];
            }
        }

        $payload = [
            'status' => $healthy ? 'ready' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ];

        return response()->json([
            'success' => $healthy,
            'message' => $healthy ? 'All systems ready.' : 'One or more checks failed.',
            'data' => $payload,
        ], $healthy ? 200 : 503);
    }

    public function metrics()
    {
        $cacheKey = 'fleetpro.app.metrics';
        $metrics = Cache::remember($cacheKey, config('monitoring.metrics_cache_ttl', 30), function () {
            return [
                'users' => DB::table('users')->count(),
                'tenants' => DB::table('tenants')->count(),
                'vehicles' => DB::table('vehicles')->count(),
                'active_subscriptions' => DB::table('subscriptions')->where('status', 'active')->count(),
                'pending_invoices' => DB::table('invoices')->whereIn('status', ['open', 'overdue'])->count(),
                'queue_connection' => config('queue.default'),
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
            ];
        });

        return $this->success($metrics, 'Application metrics retrieved.');
    }
}
