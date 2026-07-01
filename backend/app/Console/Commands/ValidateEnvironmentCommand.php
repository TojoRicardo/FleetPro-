<?php

namespace App\Console\Commands;

use App\Support\EnvironmentValidator;
use Illuminate\Console\Command;

class ValidateEnvironmentCommand extends Command
{
    protected $signature = 'env:validate {--env= : Override APP_ENV for validation}';

    protected $description = 'Validate environment variables for the current deployment profile';

    public function handle(EnvironmentValidator $validator): int
    {
        $environment = $this->option('env') ?? config('app.env');
        $result = $validator->validate($environment);

        $this->info("Validating environment: {$environment}");

        foreach ($result['warnings'] as $warning) {
            $this->warn("  WARNING: {$warning}");
        }

        if ($result['valid']) {
            $this->info('Environment validation passed.');

            return self::SUCCESS;
        }

        foreach ($result['errors'] as $error) {
            $this->error("  ERROR: {$error}");
        }

        return self::FAILURE;
    }
}
