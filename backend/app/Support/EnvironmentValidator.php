<?php

namespace App\Support;

class EnvironmentValidator
{
    /**
     * @return array{valid: bool, errors: string[], warnings: string[]}
     */
    public function validate(?string $environment = null): array
    {
        $env = $environment ?? config('app.env', 'local');
        $errors = [];
        $warnings = [];

        foreach (config("environment.required.{$env}", []) as $key) {
            if (blank(env($key))) {
                $errors[] = "Missing required environment variable: {$key}";
            }
        }

        if (in_array($env, ['staging', 'production'], true)) {
            if (config('app.debug')) {
                $errors[] = 'APP_DEBUG must be false in staging/production.';
            }

            if (config('database.default') === 'sqlite') {
                $warnings[] = 'SQLite is not recommended for staging/production.';
            }
        }

        if ($env === 'production') {
            foreach (config('environment.guards.forbidden_in_production', []) as $key => $forbiddenValues) {
                $value = strtolower((string) env($key));
                if (in_array($value, array_map('strtolower', $forbiddenValues), true)) {
                    $errors[] = "{$key} must be disabled in production.";
                }
            }
        }

        return [
            'valid' => count($errors) === 0,
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }
}
