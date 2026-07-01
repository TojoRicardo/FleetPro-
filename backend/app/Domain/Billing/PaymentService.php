<?php

namespace App\Domain\Billing;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentAttempt;
use App\Models\Subscription;
use App\Services\TenantContext;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public const PAYABLE_STATUSES = ['open', 'overdue'];

    public const ALLOWED_METHODS = ['cash', 'mobile_money', 'card'];

    public function __construct(
        private TenantContext $tenantContext,
    ) {}

    /**
     * Process a payment for an invoice with idempotency and row-level locking.
     *
     * @return array{payment: Payment, invoice: Invoice, replayed: bool}
     */
    public function payInvoice(
        int $invoiceId,
        string $paymentMethod,
        ?string $idempotencyKey = null,
        ?Request $request = null,
    ): array {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            throw ValidationException::withMessages([
                'tenant' => ['Tenant context is required to process payments.'],
            ]);
        }

        if (! in_array($paymentMethod, self::ALLOWED_METHODS, true)) {
            throw ValidationException::withMessages([
                'payment_method' => ['Payment method must be one of: cash, mobile_money, card.'],
            ]);
        }

        $idempotencyKey = $idempotencyKey ?: Str::uuid()->toString();

        $existingPayment = Payment::where('tenant_id', $tenantId)
            ->where('idempotency_key', $idempotencyKey)
            ->with('invoice')
            ->first();

        if ($existingPayment) {
            if ($existingPayment->invoice_id !== $invoiceId) {
                throw ValidationException::withMessages([
                    'idempotency_key' => ['This idempotency key was already used for a different invoice.'],
                ]);
            }

            if ($existingPayment->status === 'completed') {
                return [
                    'payment' => $existingPayment,
                    'invoice' => $existingPayment->invoice,
                    'replayed' => true,
                ];
            }
        }

        try {
            return DB::transaction(function () use ($invoiceId, $tenantId, $paymentMethod, $idempotencyKey, $request, $existingPayment) {
                $invoice = Invoice::where('tenant_id', $tenantId)
                    ->where('id', $invoiceId)
                    ->lockForUpdate()
                    ->first();

                if (! $invoice) {
                    $this->logAttempt(null, $tenantId, $invoiceId, $paymentMethod, 0, 'rejected', 'INVOICE_NOT_FOUND', 'Invoice not found.', $idempotencyKey, $request);

                    throw ValidationException::withMessages([
                        'invoice' => ['Invoice not found.'],
                    ]);
                }

                if ($existingPayment && $existingPayment->status === 'completed') {
                    return [
                        'payment' => $existingPayment,
                        'invoice' => $invoice->fresh(),
                        'replayed' => true,
                    ];
                }

                if (! in_array($invoice->status, self::PAYABLE_STATUSES, true)) {
                    $this->logAttempt(null, $tenantId, $invoice->id, $paymentMethod, $invoice->amount, 'rejected', 'INVALID_STATUS', "Invoice status '{$invoice->status}' is not payable.", $idempotencyKey, $request);

                    throw ValidationException::withMessages([
                        'invoice' => ["This invoice cannot be paid because its status is '{$invoice->status}'."],
                    ]);
                }

                $completedExists = Payment::where('invoice_id', $invoice->id)
                    ->where('status', 'completed')
                    ->exists();

                if ($completedExists) {
                    $this->logAttempt(null, $tenantId, $invoice->id, $paymentMethod, $invoice->amount, 'rejected', 'ALREADY_PAID', 'Invoice has already been paid.', $idempotencyKey, $request);

                    throw ValidationException::withMessages([
                        'invoice' => ['This invoice has already been paid.'],
                    ]);
                }

                $attempt = $this->logAttempt(null, $tenantId, $invoice->id, $paymentMethod, $invoice->amount, 'started', null, null, $idempotencyKey, $request);

                $payment = Payment::create([
                    'tenant_id' => $tenantId,
                    'invoice_id' => $invoice->id,
                    'amount' => $invoice->amount,
                    'currency' => $invoice->currency,
                    'status' => 'completed',
                    'payment_method' => $paymentMethod,
                    'idempotency_key' => $idempotencyKey,
                    'metadata' => [
                        'processed_at' => now()->toIso8601String(),
                        'source' => 'fleetpro_billing',
                    ],
                ]);

                $invoice->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                $attempt->update([
                    'payment_id' => $payment->id,
                    'status' => 'succeeded',
                ]);

                return [
                    'payment' => $payment->fresh(),
                    'invoice' => $invoice->fresh(),
                    'replayed' => false,
                ];
            });
        } catch (QueryException $e) {
            if ($this->isUniqueViolation($e)) {
                $payment = Payment::where('tenant_id', $tenantId)
                    ->where('idempotency_key', $idempotencyKey)
                    ->with('invoice')
                    ->first();

                if ($payment && $payment->invoice_id === $invoiceId && $payment->status === 'completed') {
                    return [
                        'payment' => $payment,
                        'invoice' => $payment->invoice,
                        'replayed' => true,
                    ];
                }

                $this->logAttempt(null, $tenantId, $invoiceId, $paymentMethod, 0, 'rejected', 'DUPLICATE_PAYMENT', 'A payment for this invoice is already in progress or completed.', $idempotencyKey, $request);

                throw ValidationException::withMessages([
                    'invoice' => ['A payment for this invoice is already in progress or has been completed.'],
                ]);
            }

            $this->logAttempt(null, $tenantId, $invoiceId, $paymentMethod, 0, 'failed', 'DB_ERROR', $e->getMessage(), $idempotencyKey, $request);

            throw $e;
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $this->logAttempt(null, $tenantId, $invoiceId, $paymentMethod, 0, 'failed', 'UNEXPECTED', $e->getMessage(), $idempotencyKey, $request);

            throw $e;
        }
    }

    public function getRevenueSummary(): array
    {
        $tenantId = $this->tenantContext->id();

        $paidTotal = Invoice::where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->sum('amount');

        $pendingTotal = Invoice::where('tenant_id', $tenantId)
            ->whereIn('status', ['open', 'overdue'])
            ->sum('amount');

        $overdueTotal = Invoice::where('tenant_id', $tenantId)
            ->where('status', 'overdue')
            ->sum('amount');

        $paidThisMonth = Invoice::where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        return [
            'total_revenue' => (float) $paidTotal,
            'pending_amount' => (float) $pendingTotal,
            'overdue_amount' => (float) $overdueTotal,
            'paid_this_month' => (float) $paidThisMonth,
            'mrr' => $this->calculateMrr($tenantId),
            'arr' => round($this->calculateMrr($tenantId) * 12, 2),
            'active_subscriptions' => Subscription::where('tenant_id', $tenantId)->where('status', 'active')->count(),
            'churn_rate' => $this->calculateChurnRate($tenantId),
            'currency' => 'USD',
        ];
    }

    private function calculateMrr(int $tenantId): float
    {
        $subscription = Subscription::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->with('plan')
            ->latest()
            ->first();

        if (! $subscription?->plan) {
            return 0.0;
        }

        $plan = $subscription->plan;

        return $subscription->billing_cycle === 'yearly'
            ? round((float) ($plan->price_yearly ?: $plan->price * 12) / 12, 2)
            : round((float) ($plan->price_monthly ?: $plan->price), 2);
    }

    private function calculateChurnRate(int $tenantId): float
    {
        $cancelled = Subscription::where('tenant_id', $tenantId)
            ->where('status', 'cancelled')
            ->where('cancelled_at', '>=', now()->subMonths(3))
            ->count();

        $total = Subscription::where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->subMonths(3))
            ->count();

        return $total > 0 ? round(($cancelled / $total) * 100, 2) : 0.0;
    }

    public function markOverdueInvoices(): int
    {
        return Invoice::whereIn('status', ['open'])
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->update(['status' => 'overdue']);
    }

    private function logAttempt(
        ?PaymentAttempt $attempt,
        int $tenantId,
        int $invoiceId,
        string $paymentMethod,
        float|string $amount,
        string $status,
        ?string $errorCode,
        ?string $errorMessage,
        ?string $idempotencyKey,
        ?Request $request,
    ): PaymentAttempt {
        $data = [
            'tenant_id' => $tenantId,
            'invoice_id' => $invoiceId,
            'idempotency_key' => $idempotencyKey,
            'payment_method' => $paymentMethod,
            'amount' => $amount,
            'status' => $status,
            'error_code' => $errorCode,
            'error_message' => $errorMessage,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ];

        if ($attempt) {
            $attempt->update($data);

            return $attempt->fresh();
        }

        return PaymentAttempt::create($data);
    }

    private function isUniqueViolation(QueryException $e): bool
    {
        $sqlState = $e->errorInfo[0] ?? null;

        return in_array($sqlState, ['23505', '23000'], true)
            || str_contains(strtolower($e->getMessage()), 'unique');
    }
}
