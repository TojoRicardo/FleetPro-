const STATUS_TO_API = {
  open: 'pending',
  draft: 'pending',
  paid: 'paid',
  overdue: 'overdue',
  void: 'void',
};

const STATUS_FROM_API = {
  pending: 'open',
  paid: 'paid',
  overdue: 'overdue',
};

export function mapInvoiceStatusToApi(dbStatus) {
  return STATUS_TO_API[dbStatus] ?? dbStatus;
}

export function mapInvoiceStatusFromApi(apiStatus) {
  return STATUS_FROM_API[apiStatus] ?? apiStatus;
}

export function serializeInvoice(invoice) {
  const unitPrice = invoice.unitPrice ?? inferUnitPrice(invoice);
  return {
    id: invoice.id,
    company_id: invoice.tenantId,
    company: invoice.company
      ? { id: invoice.company.id, name: invoice.company.name }
      : undefined,
    subscription_id: invoice.subscriptionId,
    number: invoice.number,
    number_of_vehicles: invoice.vehicleCount,
    unit_price: decimalToNumber(unitPrice),
    total_amount: decimalToNumber(invoice.amount),
    currency: invoice.currency?.trim() ?? 'USD',
    status: mapInvoiceStatusToApi(invoice.status),
    billing_period: invoice.billingPeriod,
    due_date: invoice.dueDate,
    paid_at: invoice.paidAt,
    line_items: invoice.lineItems,
    payments: invoice.payments?.map(serializePayment),
    created_at: invoice.createdAt,
    updated_at: invoice.updatedAt,
  };
}

export function serializePayment(payment) {
  return {
    id: payment.id,
    invoice_id: payment.invoiceId,
    amount: decimalToNumber(payment.amount),
    currency: payment.currency?.trim() ?? 'USD',
    status: payment.status,
    method: payment.paymentMethod,
    idempotency_key: payment.idempotencyKey,
    created_at: payment.createdAt,
  };
}

export function serializeSubscription(subscription) {
  return {
    id: subscription.id,
    company_id: subscription.tenantId,
    plan_id: subscription.planId,
    plan: subscription.plan
      ? {
          id: subscription.plan.id,
          name: subscription.plan.name,
          slug: subscription.plan.slug,
          price_per_vehicle: decimalToNumber(
            subscription.plan.pricePerVehicle || subscription.plan.priceMonthly,
          ),
        }
      : undefined,
    status: subscription.status,
    billing_cycle: subscription.billingCycle,
    start_date: subscription.startDate,
    end_date: subscription.endDate,
    current_period_start: subscription.currentPeriodStart,
    current_period_end: subscription.currentPeriodEnd,
    created_at: subscription.createdAt,
  };
}

function inferUnitPrice(invoice) {
  if (invoice.vehicleCount > 0) {
    return Number(invoice.amount) / invoice.vehicleCount;
  }
  return invoice.amount;
}

export function decimalToNumber(value) {
  if (value == null) return 0;
  return Number(value);
}
