import { billingApi } from '@/api/endpoints';
import { mapInvoice, mapPayment } from './adapters';
import type { BillingPaymentResult } from '@/types/billing';

export async function payInvoice(payload: {
  invoiceId: number;
  method: 'cash' | 'mobile_money' | 'card';
  amount: number;
  idempotencyKey?: string;
}): Promise<BillingPaymentResult> {
  const result = await billingApi.payInvoice(payload.invoiceId, {
    payment_method: payload.method,
    idempotency_key: payload.idempotencyKey,
  });

  return {
    payment: mapPayment(result.payment),
    invoice: mapInvoice(result.invoice),
    replayed: result.replayed,
  };
}
