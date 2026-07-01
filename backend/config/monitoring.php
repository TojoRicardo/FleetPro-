<?php

return [
    'request_logging' => env('REQUEST_LOGGING_ENABLED', true),

    'request_log_channel' => env('REQUEST_LOG_CHANNEL', 'requests'),

    'metrics_cache_ttl' => (int) env('METRICS_CACHE_TTL', 30),

    'health' => [
        'check_database' => true,
        'check_cache' => true,
        'check_queue' => env('HEALTH_CHECK_QUEUE', false),
    ],
];
