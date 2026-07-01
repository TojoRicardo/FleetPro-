<?php

namespace App\Domain\Billing;

use App\Domain\Billing\Contracts\PaymentGatewayInterface;

/**
 * @deprecated Use PaymentGatewayInterface bound to StripePaymentGateway.
 * Kept for backward compatibility — do not use in new code.
 */
class StripeGateway extends StripePaymentGateway implements PaymentGatewayInterface
{
}
