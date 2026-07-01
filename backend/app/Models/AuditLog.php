<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use BelongsToTenant;

    protected $table = 'logs';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'metadata',
        'before_value',
        'after_value',
        'ip_address',
        'user_agent',
        'route',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'before_value' => 'array',
            'after_value' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
