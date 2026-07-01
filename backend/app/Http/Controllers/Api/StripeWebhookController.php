<?php

namespace App\Http\Controllers\Api;

use App\Domain\Billing\Contracts\PaymentGatewayInterface;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Subscription;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StripeWebhookController extends Controller
{
    use ApiResponse;

    public function __construct(private PaymentGatewayInterface $gateway) {}

    public function handle(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature', '');

        try {
            $event = $this->gateway->constructWebhookEvent($payload, $signature);
        } catch (\Throwable $e) {
            Log::warning('stripe.webhook.invalid', ['message' => $e->getMessage()]);

            return $this->error('Invalid webhook.', 400);
        }

        match ($event->type) {
            'invoice.paid' => $this->handleInvoicePaid($event->data->object),
            'invoice.payment_failed' => $this->handleInvoicePaymentFailed($event->data->object),
            'customer.subscription.updated' => $this->handleSubscriptionUpdated($event->data->object),
            'customer.subscription.deleted' => $this->handleSubscriptionDeleted($event->data->object),
            default => Log::info('stripe.webhook.unhandled', ['type' => $event->type]),
        };

        return $this->success(['received' => true], 'Webhook processed.');
    }

    private function handleInvoicePaid(object $stripeInvoice): void
    {
        $invoice = Invoice::where('stripe_invoice_id', $stripeInvoice->id)->first();

        if ($invoice) {
            $invoice->update(['status' => 'paid', 'paid_at' => now()]);
        }
    }

    private function handleInvoicePaymentFailed(object $stripeInvoice): void
    {
        $invoice = Invoice::where('stripe_invoice_id', $stripeInvoice->id)->first();

        if ($invoice) {
            $invoice->update(['status' => 'failed']);
        }
    }

    private function handleSubscriptionUpdated(object $stripeSubscription): void
    {
        Subscription::where('stripe_subscription_id', $stripeSubscription->id)
            ->update(['status' => $stripeSubscription->status]);
    }

    private function handleSubscriptionDeleted(object $stripeSubscription): void
    {
        Subscription::where('stripe_subscription_id', $stripeSubscription->id)
            ->update(['status' => 'cancelled', 'cancelled_at' => now()]);
    }
}
