import { billingApi } from '@/api/endpoints';
import { mapInvoice, mapSubscription } from './adapters';
import type { BillingSubscriptionCreateResult } from '@/types/billing';
import type { BillingCycle, PlanSlug } from '@/pricing/plans.js';

/** Fallback slugs when DB was seeded with legacy plan names. */
const LEGACY_PLAN_SLUGS: Partial<Record<PlanSlug, string>> = {
  starter: 'free',
  business: 'pro',
};

interface CreatePricingSubscriptionPayload {
  plan: PlanSlug;
  vehicles: number;
  billing_cycle?: BillingCycle;
}

function findBackendPlan(
  plans: Awaited<ReturnType<typeof billingApi.getPlans>>,
  slug: PlanSlug,
) {
  return (
    plans.find((item) => item.slug === slug)
    ?? (LEGACY_PLAN_SLUGS[slug]
      ? plans.find((item) => item.slug === LEGACY_PLAN_SLUGS[slug])
      : undefined)
  );
}

export async function createPricingSubscription(
  payload: CreatePricingSubscriptionPayload,
): Promise<BillingSubscriptionCreateResult> {
  const plans = await billingApi.getPlans();
  const plan = findBackendPlan(plans, payload.plan);

  if (!plan) {
    throw new Error(`Le forfait « ${payload.plan} » n'est pas disponible. Contactez l'administrateur.`);
  }

  const subscription = await billingApi.subscribe({
    plan_id: plan.id,
    billing_cycle: payload.billing_cycle ?? 'monthly',
  });

  let pendingInvoice = null;
  try {
    const invoices = await billingApi.getInvoices({ status: 'open', per_page: 1, page: 1 });
    pendingInvoice = invoices.data[0] ? mapInvoice(invoices.data[0]) : null;
  } catch {
    /* subscription succeeded — invoice fetch is optional for redirect */
  }

  return {
    subscription: mapSubscription(subscription),
    pending_invoice: pendingInvoice,
    requires_payment: !!pendingInvoice && pendingInvoice.total_amount > 0,
  };
}
