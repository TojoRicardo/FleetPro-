import { billingApi } from '@/api/endpoints';
import { mapFilterStatusToApi, mapInvoice } from './adapters';
import type { BillingInvoice, BillingInvoiceListResponse } from '@/types/billing';

export async function getAllInvoices(params?: {
  status?: 'pending' | 'paid' | 'overdue';
  page?: number;
  limit?: number;
}): Promise<BillingInvoiceListResponse> {
  const [paginated, revenue] = await Promise.all([
    billingApi.getInvoices({
      status: mapFilterStatusToApi(params?.status),
      page: params?.page ?? 1,
      per_page: params?.limit ?? 20,
    }),
    billingApi.getRevenue(),
  ]);

  return {
    invoices: paginated.data.map(mapInvoice),
    pagination: {
      page: paginated.meta.current_page,
      limit: paginated.meta.per_page,
      total: paginated.meta.total,
      total_pages: paginated.meta.last_page,
    },
    summary: {
      total_revenue: revenue.total_revenue,
      pending_amount: revenue.pending_amount,
      overdue_amount: revenue.overdue_amount,
      currency: revenue.currency,
    },
  };
}

export async function getInvoiceById(id: number): Promise<BillingInvoice> {
  const invoice = await billingApi.getInvoice(id);
  return mapInvoice(invoice);
}
