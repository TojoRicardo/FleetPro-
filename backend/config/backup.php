<?php

return [
    'enabled' => env('BACKUP_ENABLED', true),

    'disk' => env('BACKUP_DISK', 'local'),

    'path' => env('BACKUP_PATH', 'backups/database'),

    'retention_days' => (int) env('BACKUP_RETENTION_DAYS', 30),

    'schedule' => env('BACKUP_SCHEDULE', '0 2 * * *'),

    'pg_dump_binary' => env('PG_DUMP_BINARY', 'pg_dump'),
];
