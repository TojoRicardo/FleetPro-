<?php

namespace App\Providers;

use App\Domain\Billing\BillingService;
use App\Domain\Billing\Contracts\PaymentGatewayInterface;
use App\Domain\Billing\LocalPaymentGateway;
use App\Domain\Billing\StripePaymentGateway;
use App\Services\TenantContext;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TenantContext::class);

        $this->app->bind(\App\Repositories\Contracts\VehicleRepositoryInterface::class, \App\Repositories\Eloquent\VehicleRepository::class);
        $this->app->bind(\App\Repositories\Contracts\DriverRepositoryInterface::class, \App\Repositories\Eloquent\DriverRepository::class);
        $this->app->bind(\App\Repositories\Contracts\TripRepositoryInterface::class, \App\Repositories\Eloquent\TripRepository::class);
        $this->app->bind(\App\Repositories\Contracts\MaintenanceRepositoryInterface::class, \App\Repositories\Eloquent\MaintenanceRepository::class);
        $this->app->bind(\App\Repositories\Contracts\AssignmentRepositoryInterface::class, \App\Repositories\Eloquent\AssignmentRepository::class);
        $this->app->bind(\App\Repositories\Contracts\AuditLogRepositoryInterface::class, \App\Repositories\Eloquent\AuditLogRepository::class);
        $this->app->bind(\App\Repositories\Contracts\UserRepositoryInterface::class, \App\Repositories\Eloquent\UserRepository::class);
        $this->app->bind(\App\Repositories\Contracts\DashboardRepositoryInterface::class, \App\Repositories\Eloquent\DashboardRepository::class);

        $this->app->singleton(PaymentGatewayInterface::class, function ($app) {
            if (blank(config('services.stripe.secret'))) {
                return $app->make(LocalPaymentGateway::class);
            }

            return $app->make(StripePaymentGateway::class);
        });
        $this->app->singleton(BillingService::class);
    }

    public function boot(): void
    {
        \App\Models\Vehicle::observe(\App\Observers\AuditObserver::class);
        \App\Models\Driver::observe(\App\Observers\AuditObserver::class);
        \App\Models\Trip::observe(\App\Observers\AuditObserver::class);
        \App\Models\Maintenance::observe(\App\Observers\AuditObserver::class);
        \App\Models\Assignment::observe(\App\Observers\AuditObserver::class);

        \App\Models\Vehicle::observe(\App\Observers\VehicleDomainObserver::class);
        \App\Models\Maintenance::observe(\App\Observers\MaintenanceDomainObserver::class);

        $this->configureRateLimiting();
    }

    protected function configureRateLimiting(): void
    {
        RateLimiter::for('auth-login', function (Request $request) {
            return Limit::perMinute(config('fleetpro.auth.login_max_attempts', 5))
                ->by($request->ip().'|'.(string) $request->input('email'))
                ->response(function () {
                    return response()->json([
                        'success' => false,
                        'message' => 'Too many login attempts. Please try again later.',
                    ], 429);
                });
        });

        RateLimiter::for('auth-register', function (Request $request) {
            return Limit::perMinute(config('fleetpro.auth.register_max_attempts', 3))
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'success' => false,
                        'message' => 'Too many registration attempts. Please try again later.',
                    ], 429);
                });
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by(
                $request->user()?->id ?: $request->ip()
            );
        });
    }
}
