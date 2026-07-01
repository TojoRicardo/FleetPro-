export interface BillingCompany {
  id: number;
  name: string;
}

export interface BillingInvoice {
  id: number;
  company_id: number;
  company?: BillingCompany;
  subscription_id?: number | null;
  number: string;
  number_of_vehicles: number;
  unit_price: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'void';
  billing_period?: string | null;
  due_date?: string | null;
  paid_at?: string | null;
  line_items?: Array<{
    description: string;
    amount: number;
    quantity?: number;
    unit_price?: number;
  }>;
  payments?: BillingPayment[];
  created_at: string;
  updated_at?: string;
}

export interface BillingPayment {
  id: number;
  invoice_id: number;
  amount: number;
  currency: string;
  status: string;
  method?: string | null;
  idempotency_key?: string | null;
  created_at: string;
}

export interface BillingRevenueSummary {
  total_revenue: number;
  pending_amount: number;
  overdue_amount: number;
  currency: string;
}

export interface BillingInvoiceListResponse {
  invoices: BillingInvoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  summary: BillingRevenueSummary;
}

export interface BillingPaymentResult {
  payment: BillingPayment;
  invoice: BillingInvoice;
  replayed: boolean;
}

export interface BillingSubscription {
  id: number;
  company_id: number;
  plan_id: number;
  plan?: {
    id: number;
    name: string;
    slug: string;
    price_per_vehicle: number;
  };
  status: string;
  billing_cycle: string;
  start_date?: string | null;
  end_date?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  created_at: string;
}

export interface BillingSubscriptionResponse {
  active: BillingSubscription | null;
  history: BillingSubscription[];
}

export interface BillingSubscriptionCreateResult {
  subscription: BillingSubscription;
  pending_invoice: BillingInvoice | null;
  requires_payment: boolean;
}

export interface BillingPlan {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  price_per_vehicle: number;
  max_vehicles: number;
  is_active: boolean;
}

export type InvoiceStatusFilter = 'all' | 'pending' | 'paid' | 'overdue';
