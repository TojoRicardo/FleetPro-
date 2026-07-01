import { randomBytes } from 'crypto';
import prisma from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { serializeSubscription, serializeInvoice, decimalToNumber } from '../utils/serializers.js';
import { generateInvoiceForSubscription } from './invoiceGeneration.service.js';

const YEARLY_DISCOUNT_PERCENT = 20;

const PLAN_VEHICLE_LIMITS = {
  starter: { min: 1, max: 10 },
  business: { min: 11, max: 50 },
  pro: { min: 51, max: 200 },
  enterprise: { min: 201, max: 10000 },
};

export async function listSubscriptions(companyId) {
  const subscriptions = await prisma.subscription.findMany({
    where: { tenantId: companyId },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  const active = subscriptions.find((s) => s.status === 'active') ?? null;

  return {
    active: active ? serializeSubscription(active) : null,
    history: subscriptions.map(serializeSubscription),
  };
}

export async function createSubscription(companyId, { plan_id, billing_cycle = 'monthly' }) {
  const plan = await prisma.plan.findFirst({
    where: { id: plan_id, isActive: true },
  });

  if (!plan) {
    throw new AppError('Plan not found or inactive.', 404, 'PLAN_NOT_FOUND');
  }

  const periodEnd = billing_cycle === 'yearly'
    ? addMonths(new Date(), 12)
    : addMonths(new Date(), 1);

  const subscription = await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({
      where: { tenantId: companyId, status: 'active' },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    const created = await tx.subscription.create({
      data: {
        tenantId: companyId,
        planId: plan.id,
        status: 'active',
        billingCycle: billing_cycle,
        startDate: new Date(),
        endDate: periodEnd,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    await tx.company.update({
      where: { id: companyId },
      data: { planId: plan.id },
    });

    return created;
  });

  const unitPrice = decimalToNumber(plan.pricePerVehicle || plan.priceMonthly || plan.price);
  let pendingInvoice = null;

  if (unitPrice > 0) {
    const invoice = await generateInvoiceForSubscription(subscription, new Date());
    if (invoice) {
      const full = await prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: { company: { select: { id: true, name: true } }, payments: true },
      });
      pendingInvoice = full ? serializeInvoice(full) : null;
    }
  }

  const serializedSub = serializeSubscription(
    await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: { plan: true },
    }),
  );

  return {
    subscription: serializedSub,
    pending_invoice: pendingInvoice,
    requires_payment: pendingInvoice != null,
  };
}

function calculatePricingAmount(plan, vehicleCount, billingCycle = 'monthly') {
  const base = decimalToNumber(plan.priceMonthly);
  const perVehicle = decimalToNumber(plan.pricePerVehicle);
  const monthlyTotal = Math.round((base + perVehicle * vehicleCount) * 100) / 100;

  if (billingCycle === 'yearly') {
    const yearlyBeforeDiscount = monthlyTotal * 12;
    const discount = yearlyBeforeDiscount * (YEARLY_DISCOUNT_PERCENT / 100);
    return Math.round((yearlyBeforeDiscount - discount) * 100) / 100;
  }

  return monthlyTotal;
}

export async function createFromPricing(companyId, { plan, vehicles, billing_cycle = 'monthly' }) {
  const limits = PLAN_VEHICLE_LIMITS[plan];
  if (!limits) {
    throw new AppError('Invalid plan.', 422, 'INVALID_PLAN');
  }

  const vehicleCount = Number(vehicles);
  if (!Number.isInteger(vehicleCount) || vehicleCount < limits.min || vehicleCount > limits.max) {
    throw new AppError(
      `Vehicle count must be between ${limits.min} and ${limits.max} for the ${plan} plan.`,
      422,
      'INVALID_VEHICLE_COUNT',
    );
  }

  const planRecord = await prisma.plan.findFirst({
    where: { slug: plan, isActive: true },
  });

  if (!planRecord) {
    throw new AppError('Plan not found or inactive.', 404, 'PLAN_NOT_FOUND');
  }

  const periodEnd = billing_cycle === 'yearly'
    ? addMonths(new Date(), 12)
    : addMonths(new Date(), 1);

  const subscription = await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({
      where: { tenantId: companyId, status: 'active' },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    const created = await tx.subscription.create({
      data: {
        tenantId: companyId,
        planId: planRecord.id,
        status: 'active',
        billingCycle: billing_cycle,
        startDate: new Date(),
        endDate: periodEnd,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    await tx.company.update({
      where: { id: companyId },
      data: { planId: planRecord.id },
    });

    return created;
  });

  let pendingInvoice = null;
  const amount = calculatePricingAmount(planRecord, vehicleCount, billing_cycle);

  if (amount > 0) {
    const now = new Date();
    const ym = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const number = `INV-${ym}-${randomBytes(3).toString('hex').toUpperCase()}`;
    const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const dueDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
    const baseAmount = decimalToNumber(planRecord.priceMonthly);
    const perVehicle = decimalToNumber(planRecord.pricePerVehicle);

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: companyId,
        subscriptionId: subscription.id,
        number,
        amount,
        unitPrice: perVehicle || baseAmount,
        currency: 'USD',
        status: 'open',
        billingPeriod: period,
        vehicleCount,
        dueDate,
        lineItems: [
          {
            description: `${planRecord.name} base`,
            amount: baseAmount,
          },
          ...(perVehicle > 0
            ? [{
                description: `${vehicleCount} vehicle(s) × ${perVehicle.toFixed(2)}`,
                quantity: vehicleCount,
                unit_price: perVehicle,
                amount: Math.round(perVehicle * vehicleCount * 100) / 100,
              }]
            : []),
        ],
      },
      include: { company: { select: { id: true, name: true } }, payments: true },
    });

    pendingInvoice = serializeInvoice(invoice);
  }

  const serializedSub = serializeSubscription(
    await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: { plan: true },
    }),
  );

  return {
    subscription: serializedSub,
    pending_invoice: pendingInvoice,
    requires_payment: pendingInvoice != null,
  };
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
