<?php

return [
    'allow_public_registration' => env('ALLOW_PUBLIC_REGISTRATION', true),

    'auth' => [
        'login_max_attempts' => (int) env('AUTH_LOGIN_RATE_LIMIT', 5),
        'login_decay_minutes' => (int) env('AUTH_LOGIN_RATE_DECAY', 1),
        'register_max_attempts' => (int) env('AUTH_REGISTER_RATE_LIMIT', 3),
        'refresh_token_enabled' => env('REFRESH_TOKEN_ENABLED', true),
        'refresh_token_ttl_days' => (int) env('REFRESH_TOKEN_TTL_DAYS', 30),
    ],

    'dashboard' => [
        'cache_ttl' => (int) env('DASHBOARD_CACHE_TTL', 60),
    ],

    'realtime' => [
        'broadcast_url' => env('REALTIME_BROADCAST_URL'),
        'internal_secret' => env('REALTIME_INTERNAL_SECRET'),
    ],
];
