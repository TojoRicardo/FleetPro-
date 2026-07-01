<?php

use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\SyslogUdpHandler;
use Monolog\Processor\PsrLogMessageProcessor;

return [
    'default' => env('LOG_CHANNEL', 'stack'),
    'deprecations' => [
        'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
        'trace' => env('LOG_DEPRECATIONS_TRACE', false),
    ],
    'channels' => [
        'stack' => [
            'driver' => 'stack',
            'channels' => explode(',', env('LOG_STACK', 'single')),
            'ignore_exceptions' => false,
        ],
        'single' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],
        'json' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel-json.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'formatter' => Monolog\Formatter\JsonFormatter::class,
            'replace_placeholders' => true,
        ],
        'requests' => [
            'driver' => 'single',
            'path' => storage_path('logs/requests.log'),
            'level' => 'info',
            'formatter' => Monolog\Formatter\JsonFormatter::class,
            'replace_placeholders' => true,
        ],
        'null' => [
            'driver' => 'monolog',
            'handler' => NullHandler::class,
        ],
    ],
];
