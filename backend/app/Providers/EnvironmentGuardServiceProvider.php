<?php

namespace App\Providers;

use App\Support\EnvironmentValidator;
use Illuminate\Support\ServiceProvider;

class EnvironmentGuardServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if (! $this->app->runningInConsole() && in_array(config('app.env'), ['staging', 'production'], true)) {
            $result = app(EnvironmentValidator::class)->validate();

            if (! $result['valid']) {
                logger()->critical('Environment validation failed at boot.', [
                    'errors' => $result['errors'],
                    'environment' => config('app.env'),
                ]);

                if (config('app.env') === 'production') {
                    abort(503, 'Service configuration error. Contact support.');
                }
            }
        }
    }
}
