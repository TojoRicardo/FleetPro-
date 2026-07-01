<?php

namespace App\Domain\Billing;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\TenantContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InvoiceGenerationService
{
    public function __construct(
        private TenantContext $tenantContext,
    ) {}

    public function generateForSubscription(Subscription $subscription, ?\DateTimeInterface $period = null): ?Invoice
    {
        $period = $period ?? now();
        $billingPeriod = $period->format('Y-m-01');

        $subscription->loadMissing(['plan', 'tenant']);

        if (! $subscription->isActive()) {
            return null;
        }

        $existing = Invoice::where('subscription_id', $subscription->id)
            ->where('billing_period', $billingPeriod)
            ->first();

        if ($existing) {
            return null;
        }

        $vehicleCount = Vehicle::where('tenant_id', $subscription->tenant_id)->count();
        $plan = $subscription->plan;
        $pricePerVehicle = (float) ($plan->price_per_vehicle ?: $plan->getEffectivePrice());

        if ($pricePerVehicle <= 0) {
            return null;
        }

        $amount = round($pricePerVehicle * max($vehicleCount, 1), 2);

        return Invoice::create([
            'tenant_id' => $subscription->tenant_id,
            'subscription_id' => $subscription->id,
            'number' => $this->generateInvoiceNumber(),
            'amount' => $amount,
            'currency' => 'USD',
            'status' => 'open',
            'billing_period' => $billingPeriod,
            'vehicle_count' => $vehicleCount,
            'due_date' => now()->parse($billingPeriod)->endOfMonth(),
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

    public function generateMonthlyInvoices(?\DateTimeInterface $period = null): array
    {
        $period = $period ?? now();
        $generated = 0;
        $skipped = 0;
        $errors = [];

        Subscription::where('status', 'active')
            ->with(['plan', 'tenant'])
            ->orderBy('id')
            ->chunkById(100, function ($subscriptions) use ($period, &$generated, &$skipped, &$errors) {
                foreach ($subscriptions as $subscription) {
                    try {
                        $invoice = $this->generateForSubscription($subscription, $period);
                        $invoice ? $generated++ : $skipped++;
                    } catch (\Throwable $e) {
                        $errors[] = [
                            'subscription_id' => $subscription->id,
                            'tenant_id' => $subscription->tenant_id,
                            'message' => $e->getMessage(),
                        ];
                    }
                }
            });

        return compact('generated', 'skipped', 'errors');
    }

    private function generateInvoiceNumber(): string
    {
        return 'INV-'.now()->format('Ym').'-'.strtoupper(Str::random(6));
    }
}
