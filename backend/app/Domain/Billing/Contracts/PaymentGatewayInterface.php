<?php

namespace App\Domain\Billing\Contracts;

use App\Models\Plan;
use App\Models\Tenant;

interface PaymentGatewayInterface
{
    public function createCustomer(Tenant $tenant): array;

    public function createSubscription(Tenant $tenant, Plan $plan, string $billingCycle): array;

    public function cancelSubscription(string $stripeSubscriptionId): array;

    public function createPaymentIntent(float $amount, string $currency = 'USD', array $metadata = []): array;

    public function constructWebhookEvent(string $payload, string $signature): object;
}
