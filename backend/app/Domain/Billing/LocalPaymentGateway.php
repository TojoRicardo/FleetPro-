<?php

namespace App\Domain\Billing;

use App\Domain\Billing\Contracts\PaymentGatewayInterface;
use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Support\Str;

/**
 * Offline payment gateway for local/dev when STRIPE_SECRET is not configured.
 */
class LocalPaymentGateway implements PaymentGatewayInterface
{
    public function createCustomer(Tenant $tenant): array
    {
        return [
            'customer_id' => 'local_cus_'.$tenant->id,
            'status' => 'active',
        ];
    }

    public function createSubscription(Tenant $tenant, Plan $plan, string $billingCycle): array
    {
        if (! $tenant->stripe_customer_id) {
            $customer = $this->createCustomer($tenant);
            $tenant->update(['stripe_customer_id' => $customer['customer_id']]);
        }

        return [
            'subscription_id' => 'local_sub_'.Str::uuid(),
            'status' => 'active',
            'billing_cycle' => $billingCycle,
            'client_secret' => null,
        ];
    }

    public function cancelSubscription(string $stripeSubscriptionId): array
    {
        return [
            'subscription_id' => $stripeSubscriptionId,
            'status' => 'cancelled',
        ];
    }

    public function createPaymentIntent(float $amount, string $currency = 'USD', array $metadata = []): array
    {
        return [
            'payment_intent_id' => 'local_pi_'.Str::uuid(),
            'client_secret' => null,
            'amount' => $amount,
            'currency' => $currency,
            'status' => 'succeeded',
        ];
    }

    public function constructWebhookEvent(string $payload, string $signature): object
    {
        throw new \RuntimeException('Stripe webhooks are disabled without STRIPE_SECRET.');
    }
}
