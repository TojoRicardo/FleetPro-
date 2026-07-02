<?php

namespace App\Domain\Billing;

use App\Models\Invoice;
use App\Models\Subscription;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class InvoiceGenerationService
{
    public function generateMonthlyInvoices(?Carbon $runDate = null): array
    {
        $runDate = ($runDate ?? now())->copy()->utc();
        $period = $runDate->copy()->startOfMonth()->toDateString();
        $lockKey = "billing:generate:{$period}";

        $lock = Cache::lock($lockKey, 3600);

        if (! $lock->get()) {
            Log::warning('Monthly invoice generation skipped — lock held', ['period' => $period]);

            return [
                'generated' => 0,
                'skipped' => 0,
                'errors' => [],
                'period' => $period,
                'locked' => true,
            ];
        }

        $generated = 0;
        $skipped = 0;
        $errors = [];

        try {
            Log::info('Starting monthly invoice generation', ['period' => $period]);

            $subscriptions = Subscription::query()
                ->where('status', 'active')
                ->with('plan')
                ->orderBy('id')
                ->get();

            foreach ($subscriptions as $subscription) {
                try {
                    if ($this->invoiceExists($subscription->id, $period)) {
                        $skipped++;

                        continue;
                    }

                    $invoice = $this->createInvoiceForSubscription($subscription, $period);
                    if ($invoice) {
                        $generated++;
                        Log::info('Invoice created', [
                            'subscription_id' => $subscription->id,
                            'tenant_id' => $subscription->tenant_id,
                            'invoice_id' => $invoice->id,
                            'number' => $invoice->number,
                            'amount' => $invoice->amount,
                        ]);
                    } else {
                        $skipped++;
                    }
                } catch (\Throwable $e) {
                    $errors[] = [
                        'subscription_id' => $subscription->id,
                        'tenant_id' => $subscription->tenant_id,
                        'message' => $e->getMessage(),
                    ];
                    Log::error('Failed to generate invoice for subscription', [
                        'subscription_id' => $subscription->id,
                        'tenant_id' => $subscription->tenant_id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } finally {
            $lock->release();
        }

        $summary = [
            'generated' => $generated,
            'skipped' => $skipped,
            'errors' => $errors,
            'period' => $period,
            'locked' => false,
        ];

        Log::info('Monthly invoice generation finished', $summary);

        return $summary;
    }

    private function invoiceExists(int $subscriptionId, string $period): bool
    {
        return Invoice::query()
            ->where('subscription_id', $subscriptionId)
            ->whereDate('billing_period', $period)
            ->exists();
    }

    private function createInvoiceForSubscription(Subscription $subscription, string $period): ?Invoice
    {
        $plan = $subscription->plan;
        if (! $plan) {
            return null;
        }

        $pricePerVehicle = (float) ($plan->price_per_vehicle ?: $plan->price ?: $plan->price_monthly ?: 0);
        if ($pricePerVehicle <= 0) {
            return null;
        }

        $vehicleCount = Vehicle::where('tenant_id', $subscription->tenant_id)->count();
        $billableVehicles = max($vehicleCount, 1);
        $amount = round($pricePerVehicle * $billableVehicles, 2);
        $dueDate = Carbon::parse($period)->utc()->endOfMonth();

        return Invoice::create([
            'tenant_id' => $subscription->tenant_id,
            'subscription_id' => $subscription->id,
            'number' => $this->invoiceNumber(),
            'amount' => $amount,
            'currency' => 'USD',
            'status' => 'open',
            'billing_period' => $period,
            'vehicle_count' => $vehicleCount,
            'due_date' => $dueDate,
            'line_items' => [
                [
                    'description' => "{$plan->name} — {$vehicleCount} vehicle(s) × ".number_format($pricePerVehicle, 2),
                    'quantity' => $vehicleCount,
                    'unit_price' => $pricePerVehicle,
                    'amount' => $amount,
                ],
            ],
        ]);
    }

    private function invoiceNumber(): string
    {
        return 'INV-'.now()->format('Ym').'-'.strtoupper(Str::random(6));
    }
}
