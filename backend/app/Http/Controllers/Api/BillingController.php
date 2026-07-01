<?php

namespace App\Http\Controllers\Api;

use App\Domain\Billing\BillingService;
use App\Domain\Billing\PaymentService;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    use ApiResponse;

    public function __construct(
        private BillingService $billingService,
        private PaymentService $paymentService,
    ) {}

    public function subscription()
    {
        return $this->success([
            'subscription' => $this->billingService->getCurrentSubscription(),
            'usage' => $this->billingService->getUsage(),
        ]);
    }

    public function plans()
    {
        return $this->success($this->billingService->getPlans());
    }

    public function subscribe(Request $request)
    {
        $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'billing_cycle' => ['sometimes', 'in:monthly,yearly'],
        ]);

        $subscription = $this->billingService->subscribe(
            $request->plan_id,
            $request->billing_cycle ?? 'monthly'
        );

        return $this->success($subscription, 'Subscription updated successfully.');
    }

    public function cancel()
    {
        $subscription = $this->billingService->cancelSubscription();

        return $this->success($subscription, 'Subscription cancelled.');
    }

    public function invoices(Request $request)
    {
        $request->validate([
            'status' => ['sometimes', 'in:draft,open,paid,void,overdue'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        return $this->paginated($this->billingService->getInvoices(
            (int) $request->get('per_page', 15),
            $request->get('status'),
        ));
    }

    public function showInvoice(int $invoice)
    {
        return $this->success($this->billingService->getInvoice($invoice));
    }

    public function revenue()
    {
        return $this->success($this->paymentService->getRevenueSummary());
    }

    public function payInvoice(Request $request, int $invoice)
    {
        $request->validate([
            'payment_method' => ['required', 'in:cash,mobile_money,card'],
            'idempotency_key' => ['sometimes', 'string', 'max:64'],
        ]);

        $idempotencyKey = $request->header('Idempotency-Key') ?: $request->input('idempotency_key');

        $result = $this->paymentService->payInvoice(
            $invoice,
            $request->payment_method,
            $idempotencyKey,
            $request,
        );

        $message = $result['replayed']
            ? 'Payment already processed (idempotent replay).'
            : 'Payment completed successfully.';

        return $this->success([
            'payment' => $result['payment'],
            'invoice' => $result['invoice'],
            'replayed' => $result['replayed'],
        ], $message);
    }
}
