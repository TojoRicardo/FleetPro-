import { billingApi } from '@/api/endpoints';
import { mapSubscription } from './adapters';
import type { BillingSubscriptionResponse } from '@/types/billing';

export async function getSubscriptions(): Promise<BillingSubscriptionResponse> {
  const data = await billingApi.getSubscription();

  return {
    active: data.subscription ? mapSubscription(data.subscription) : null,
    history: [],
  };
}
