<?php

/**
 * FleetPro environment profiles.
 *
 * APP_ENV values: local | staging | production
 * Run `php artisan env:validate` before deploy.
 */
return [
    'profiles' => [
        'local' => [
            'debug' => true,
            'log_level' => 'debug',
        ],
        'staging' => [
            'debug' => false,
            'log_level' => 'info',
        ],
        'production' => [
            'debug' => false,
            'log_level' => 'warning',
        ],
    ],

    'required' => [
        'local' => [
            'APP_KEY',
            'APP_URL',
        ],
        'staging' => [
            'APP_KEY',
            'APP_URL',
            'DB_CONNECTION',
            'DB_HOST',
            'DB_DATABASE',
            'DB_USERNAME',
            'DB_PASSWORD',
            'CORS_ALLOWED_ORIGINS',
            'FRONTEND_URL',
        ],
        'production' => [
            'APP_KEY',
            'APP_URL',
            'DB_CONNECTION',
            'DB_HOST',
            'DB_DATABASE',
            'DB_USERNAME',
            'DB_PASSWORD',
            'CORS_ALLOWED_ORIGINS',
            'FRONTEND_URL',
            'STRIPE_SECRET',
            'STRIPE_WEBHOOK_SECRET',
        ],
    ],

    'guards' => [
        'forbidden_in_production' => [
            'APP_DEBUG' => ['true', '1'],
            'ALLOW_PUBLIC_REGISTRATION' => ['true', '1'],
        ],
    ],
];
