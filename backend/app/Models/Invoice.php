<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'subscription_id',
        'number',
        'amount',
        'currency',
        'status',
        'billing_period',
        'vehicle_count',
        'due_date',
        'paid_at',
        'stripe_invoice_id',
        'line_items',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'billing_period' => 'date',
            'due_date' => 'datetime',
            'paid_at' => 'datetime',
            'line_items' => 'array',
        ];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function paymentAttempts(): HasMany
    {
        return $this->hasMany(PaymentAttempt::class);
    }

    public function isPayable(): bool
    {
        return in_array($this->status, ['open', 'overdue'], true);
    }
}
