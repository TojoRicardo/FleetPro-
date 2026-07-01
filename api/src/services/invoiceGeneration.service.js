import { randomBytes } from 'crypto';
import prisma from '../config/database.js';

const JOB_NAME = 'monthly_invoice_generation';

function billingPeriod(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function invoiceNumber() {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `INV-${ym}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

function endOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59));
}

async function countVehicles(companyId) {
  return prisma.vehicle.count({ where: { tenantId: companyId } });
}

function resolveUnitPrice(plan) {
  return Number(plan.pricePerVehicle || plan.price || plan.priceMonthly || 0);
}

export async function generateInvoiceForSubscription(subscription, periodDate = new Date()) {
  const period = billingPeriod(periodDate);

  const existing = await prisma.invoice.findFirst({
    where: {
      subscriptionId: subscription.id,
      billingPeriod: period,
    },
  });

  if (existing) {
    return null;
  }

  const plan =
    subscription.plan ??
    (await prisma.plan.findUnique({ where: { id: subscription.planId } }));

  const unitPrice = resolveUnitPrice(plan);
  if (unitPrice <= 0) {
    return null;
  }

  const vehicleCount = await countVehicles(subscription.tenantId);
  const billableVehicles = Math.max(vehicleCount, 1);
  const totalAmount = Math.round(unitPrice * billableVehicles * 100) / 100;

  try {
    return await prisma.invoice.create({
      data: {
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        number: invoiceNumber(),
        amount: totalAmount,
        unitPrice,
        currency: 'USD',
        status: 'open',
        billingPeriod: period,
        vehicleCount,
        dueDate: endOfMonth(period),
        lineItems: [
          {
            description: `${plan.name} — ${vehicleCount} vehicle(s) × ${unitPrice.toFixed(2)}`,
            quantity: vehicleCount,
            unit_price: unitPrice,
            amount: totalAmount,
          },
        ],
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return null;
    }
    throw error;
  }
}

async function acquireLock(lockKey) {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

  await prisma.billingJobLock.deleteMany({
    where: { jobName: JOB_NAME, expiresAt: { lt: new Date() } },
  });

  try {
    await prisma.billingJobLock.create({
      data: {
        jobName: JOB_NAME,
        lockKey,
        lockedAt: new Date(),
        expiresAt,
      },
    });
    return true;
  } catch (error) {
    if (error.code === 'P2002') {
      return false;
    }
    throw error;
  }
}

async function releaseLock(lockKey) {
  await prisma.billingJobLock.deleteMany({
    where: { jobName: JOB_NAME, lockKey },
  });
}

export async function generateMonthlyInvoices(runDate = new Date()) {
  const period = billingPeriod(runDate);
  const lockKey = period.toISOString().slice(0, 10);

  const locked = await acquireLock(lockKey);
  if (!locked) {
    return { generated: 0, skipped: 0, errors: [], locked: true, period: lockKey };
  }

  let generated = 0;
  let skipped = 0;
  const errors = [];

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'active' },
      include: { plan: true },
      orderBy: { id: 'asc' },
    });

    for (const subscription of subscriptions) {
      try {
        const invoice = await generateInvoiceForSubscription(subscription, runDate);
        invoice ? generated++ : skipped++;
      } catch (error) {
        errors.push({
          subscription_id: subscription.id,
          company_id: subscription.tenantId,
          message: error.message,
        });
      }
    }

    await prisma.invoice.updateMany({
      where: { status: 'open', dueDate: { lt: new Date() } },
      data: { status: 'overdue' },
    });
  } finally {
    await releaseLock(lockKey);
  }

  return { generated, skipped, errors, locked: false, period: lockKey };
}
