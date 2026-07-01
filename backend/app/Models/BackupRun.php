<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BackupRun extends Model
{
    protected $fillable = [
        'filename',
        'disk',
        'path',
        'size_bytes',
        'driver',
        'trigger',
        'status',
        'error_message',
        'retention_until',
    ];

    protected function casts(): array
    {
        return [
            'retention_until' => 'datetime',
        ];
    }
}
