<?php

namespace App\Domain\Billing;

use App\Domain\Billing\Contracts\PaymentGatewayInterface;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\TenantContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BillingService
{
    public function __construct(
        private TenantContext $tenantContext,
        private PaymentGatewayInterface $paymentGateway,
    ) {}

    public function getCurrentSubscription(): ?Subscription
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return null;
        }

        return Subscription::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->with('plan')
            ->latest()
            ->first();
    }

    public function getCurrentPlan(): ?Plan
    {
        return $this->getCurrentSubscription()?->plan;
    }

    public function canCreate(string $resource): bool
    {
        $plan = $this->getCurrentPlan();

        if (! $plan) {
            return false;
        }

        $tenantId = $this->tenantContext->id();

        return match ($resource) {
            'vehicles' => Vehicle::where('tenant_id', $tenantId)->count() < $plan->getEffectiveVehicleLimit(),
            'users' => User::where('tenant_id', $tenantId)->count() < ($plan->max_users ?? 3),
            'drivers' => \App\Models\Driver::where('tenant_id', $tenantId)->count() < ($plan->max_drivers ?? 10),
            default => true,
        };
    }

    public function getUsage(): array
    {
        $tenantId = $this->tenantContext->id();
        $plan = $this->getCurrentPlan();

        return [
            'vehicles' => [
                'used' => Vehicle::where('tenant_id', $tenantId)->count(),
                'limit' => $plan?->getEffectiveVehicleLimit() ?? 0,
            ],
            'users' => [
                'used' => User::where('tenant_id', $tenantId)->count(),
                'limit' => $plan?->max_users ?? 0,
            ],
            'drivers' => [
                'used' => \App\Models\Driver::where('tenant_id', $tenantId)->count(),
                'limit' => $plan?->max_drivers ?? 0,
            ],
        ];
    }

    public function subscribe(int $planId, string $billingCycle = 'monthly'): Subscription
    {
        $plan = Plan::findOrFail($planId);
        $tenant = $this->tenantContext->get();

        if (! $tenant) {
            throw ValidationException::withMessages(['tenant' => ['Tenant not found.']]);
        }

        return DB::transaction(function () use ($plan, $tenant, $billingCycle) {
            Subscription::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

            $stripeResult = $this->paymentGateway->createSubscription(
                $tenant,
                $plan,
                $billingCycle
            );

            $periodEnd = $billingCycle === 'yearly' ? now()->addYear() : now()->addMonth();

            $subscription = Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'status' => 'active',
                'start_date' => now()->toDateString(),
                'end_date' => $periodEnd->toDateString(),
                'billing_cycle' => $billingCycle,
                'current_period_start' => now(),
                'current_period_end' => $periodEnd,
                'stripe_subscription_id' => $stripeResult['subscription_id'] ?? null,
            ]);

            $tenant->update(['plan_id' => $plan->id]);

            $amount = $billingCycle === 'yearly' ? ($plan->price_yearly ?: $plan->price * 12) : ($plan->price ?: $plan->price_monthly);

            if ($amount > 0) {
                $this->createInvoice($tenant, $subscription, $amount, $plan->name);
            }

            return $subscription->load('plan');
        });
    }

    public function cancelSubscription(): Subscription
    {
        $subscription = $this->getCurrentSubscription();

        if (! $subscription) {
            throw ValidationException::withMessages(['subscription' => ['No active subscription found.']]);
        }

        if ($subscription->stripe_subscription_id) {
            $this->paymentGateway->cancelSubscription($subscription->stripe_subscription_id);
        }

        $subscription->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return $subscription;
    }

    public function getInvoices(int $perPage = 15, ?string $status = null)
    {
        $query = Invoice::with(['payments', 'subscription.plan'])
            ->orderByDesc('created_at');

        if ($tenantId = $this->tenantContext->id()) {
            $query->where('tenant_id', $tenantId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        return $query->paginate($perPage);
    }

    public function getInvoice(int $id): Invoice
    {
        return Invoice::with(['payments', 'paymentAttempts', 'subscription.plan'])
            ->findOrFail($id);
    }

    public function getPlans()
    {
        return Plan::where('is_active', true)->orderBy('price_monthly')->get();
    }

    private function createInvoice(Tenant $tenant, Subscription $subscription, float $amount, string $planName): Invoice
    {
        $invoice = Invoice::create([
            'tenant_id' => $tenant->id,
            'subscription_id' => $subscription->id,
            'number' => 'INV-'.strtoupper(Str::random(8)),
            'amount' => $amount,
            'currency' => 'USD',
            'status' => 'open',
            'billing_period' => now()->format('Y-m-01'),
            'vehicle_count' => Vehicle::where('tenant_id', $tenant->id)->count(),
            'due_date' => now()->addDays(14),
            'line_items' => [
                ['description' => "{$planName} subscription", 'amount' => $amount],
            ],
        ]);

        return $invoice;
    }
}
