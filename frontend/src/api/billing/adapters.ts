import type { Invoice, Payment, Plan, Subscription } from '@/types';
import type {
  BillingInvoice,
  BillingPayment,
  BillingPlan,
  BillingSubscription,
} from '@/types/billing';

export function mapInvoiceStatus(status: Invoice['status']): BillingInvoice['status'] {
  if (status === 'open' || status === 'draft' || status === 'unpaid') return 'pending';
  if (status === 'paid' || status === 'overdue' || status === 'void') return status;
  return 'pending';
}

export function mapFilterStatusToApi(
  status?: 'pending' | 'paid' | 'overdue',
): 'open' | 'paid' | 'overdue' | undefined {
  if (!status) return undefined;
  return status === 'pending' ? 'open' : status;
}

export function mapPayment(payment: Payment): BillingPayment {
  return {
    id: payment.id,
    invoice_id: payment.invoice_id,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    method: payment.payment_method ?? null,
    created_at: payment.created_at,
  };
}

export function mapInvoice(invoice: Invoice): BillingInvoice {
  const vehicleCount = invoice.vehicle_count ?? 0;
  const totalAmount = Number(invoice.amount);
  const unitPrice = vehicleCount > 0 ? totalAmount / vehicleCount : totalAmount;

  return {
    id: invoice.id,
    company_id: invoice.tenant_id,
    subscription_id: invoice.subscription_id,
    number: invoice.number,
    number_of_vehicles: vehicleCount,
    unit_price: unitPrice,
    total_amount: totalAmount,
    currency: invoice.currency,
    status: mapInvoiceStatus(invoice.status),
    billing_period: invoice.billing_period,
    due_date: invoice.due_date,
    paid_at: invoice.paid_at,
    line_items: invoice.line_items,
    payments: invoice.payments?.map(mapPayment),
    created_at: invoice.created_at,
    updated_at: invoice.updated_at,
  };
}

export function mapSubscription(subscription: Subscription): BillingSubscription {
  return {
    id: subscription.id,
    company_id: subscription.tenant_id,
    plan_id: subscription.plan_id,
    plan: subscription.plan
      ? {
          id: subscription.plan.id,
          name: subscription.plan.name,
          slug: subscription.plan.slug,
          price_per_vehicle: Number(subscription.plan.price_monthly ?? subscription.plan.price ?? 0),
        }
      : undefined,
    status: subscription.status,
    billing_cycle: (subscription as Subscription & { billing_cycle?: string }).billing_cycle ?? 'monthly',
    start_date: subscription.start_date ?? null,
    end_date: subscription.end_date ?? null,
    current_period_start: (subscription as Subscription & { current_period_start?: string | null })
      .current_period_start ?? null,
    current_period_end: (subscription as Subscription & { current_period_end?: string | null })
      .current_period_end ?? null,
    created_at: (subscription as Subscription & { created_at?: string }).created_at ?? new Date().toISOString(),
  };
}

export function mapPlan(plan: Plan): BillingPlan {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    price_monthly: Number(plan.price_monthly ?? plan.price ?? 0),
    price_yearly: Number(plan.price_yearly ?? 0),
    price_per_vehicle: Number(plan.price_monthly ?? plan.price ?? 0),
    max_vehicles: plan.max_vehicles ?? plan.vehicle_limit ?? 0,
    is_active: true,
  };
}
