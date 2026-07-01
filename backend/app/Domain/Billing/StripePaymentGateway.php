<?php

namespace App\Domain\Billing;

use App\Domain\Billing\Contracts\PaymentGatewayInterface;
use App\Models\Plan;
use App\Models\Tenant;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripePaymentGateway implements PaymentGatewayInterface
{
    private ?StripeClient $client = null;

    private function client(): StripeClient
    {
        if ($this->client === null) {
            $secret = config('services.stripe.secret');

            if (blank($secret)) {
                throw new \RuntimeException('STRIPE_SECRET is required for payment processing.');
            }

            $this->client = new StripeClient($secret);
        }

        return $this->client;
    }

    public function createCustomer(Tenant $tenant): array
    {
        $customer = $this->client()->customers->create([
            'name' => $tenant->name,
            'email' => $tenant->email,
            'metadata' => [
                'tenant_id' => (string) $tenant->id,
                'tenant_slug' => $tenant->slug,
            ],
        ]);

        return [
            'customer_id' => $customer->id,
            'status' => 'active',
        ];
    }

    public function createSubscription(Tenant $tenant, Plan $plan, string $billingCycle): array
    {
        if (! $tenant->stripe_customer_id) {
            $customer = $this->createCustomer($tenant);
            $tenant->update(['stripe_customer_id' => $customer['customer_id']]);
        }

        $priceId = $billingCycle === 'yearly'
            ? ($plan->stripe_price_id_yearly ?? $plan->stripe_price_id)
            : ($plan->stripe_price_id ?? $plan->stripe_price_id_monthly);

        if (blank($priceId)) {
            throw new \RuntimeException("Plan {$plan->slug} has no Stripe price configured.");
        }

        $subscription = $this->client()->subscriptions->create([
            'customer' => $tenant->stripe_customer_id,
            'items' => [['price' => $priceId]],
            'metadata' => [
                'tenant_id' => (string) $tenant->id,
                'plan_id' => (string) $plan->id,
            ],
            'payment_behavior' => 'default_incomplete',
            'expand' => ['latest_invoice.payment_intent'],
        ]);

        return [
            'subscription_id' => $subscription->id,
            'status' => $subscription->status,
            'billing_cycle' => $billingCycle,
            'client_secret' => $subscription->latest_invoice?->payment_intent?->client_secret,
        ];
    }

    public function cancelSubscription(string $stripeSubscriptionId): array
    {
        $subscription = $this->client()->subscriptions->cancel($stripeSubscriptionId);

        return [
            'subscription_id' => $subscription->id,
            'status' => $subscription->status,
        ];
    }

    public function createPaymentIntent(float $amount, string $currency = 'USD', array $metadata = []): array
    {
        $intent = $this->client()->paymentIntents->create([
            'amount' => (int) round($amount * 100),
            'currency' => strtolower($currency),
            'metadata' => $metadata,
            'automatic_payment_methods' => ['enabled' => true],
        ]);

        return [
            'payment_intent_id' => $intent->id,
            'client_secret' => $intent->client_secret,
            'amount' => $amount,
            'currency' => $currency,
            'status' => $intent->status,
        ];
    }

    public function constructWebhookEvent(string $payload, string $signature): object
    {
        $secret = config('services.stripe.webhook_secret');

        if (blank($secret)) {
            throw new \RuntimeException('STRIPE_WEBHOOK_SECRET is not configured.');
        }

        try {
            return Webhook::constructEvent($payload, $signature, $secret);
        } catch (SignatureVerificationException $e) {
            throw new \RuntimeException('Invalid Stripe webhook signature.');
        }
    }
}
