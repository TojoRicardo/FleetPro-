import { randomBytes } from 'crypto';
import { logger } from './logger.js';
import { acquireJobLock, releaseJobLock } from './jobLock.js';
import { withTransaction } from './db.js';

function billingPeriod(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

function invoiceNumber() {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `INV-${ym}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

function endOfMonth(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0, 23, 59, 59));
}

async function countVehicles(client, tenantId) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS count FROM vehicles WHERE tenant_id = $1`,
    [tenantId]
  );
  return rows[0]?.count ?? 0;
}

async function resolvePricePerVehicle(client, planId) {
  const { rows } = await client.query(
    `SELECT
       COALESCE(NULLIF(price_per_vehicle, 0), NULLIF(price, 0), NULLIF(price_monthly, 0), 0)::numeric AS price_per_vehicle,
       name
     FROM plans WHERE id = $1`,
    [planId]
  );
  return rows[0] || { price_per_vehicle: 0, name: 'Plan' };
}

async function invoiceExists(client, subscriptionId, period) {
  const { rows } = await client.query(
    `SELECT id FROM invoices
     WHERE subscription_id = $1 AND billing_period = $2::date
     LIMIT 1`,
    [subscriptionId, period]
  );
  return rows.length > 0;
}

async function createInvoice(client, subscription, period) {
  const vehicleCount = await countVehicles(client, subscription.tenant_id);
  const plan = await resolvePricePerVehicle(client, subscription.plan_id);
  const pricePerVehicle = Number(plan.price_per_vehicle);

  if (pricePerVehicle <= 0) {
    logger.info('Skipping free plan subscription', {
      subscriptionId: subscription.id,
      tenantId: subscription.tenant_id,
    });
    return null;
  }

  const billableVehicles = Math.max(vehicleCount, 1);
  const amount = Math.round(pricePerVehicle * billableVehicles * 100) / 100;
  const number = invoiceNumber();
  const dueDate = endOfMonth(period);
  const lineItems = JSON.stringify([
    {
      description: `${plan.name} — ${vehicleCount} vehicle(s) × ${pricePerVehicle.toFixed(2)}`,
      quantity: vehicleCount,
      unit_price: pricePerVehicle,
      amount,
    },
  ]);

  const { rows } = await client.query(
    `INSERT INTO invoices (
       tenant_id, subscription_id, number, amount, currency, status,
       billing_period, vehicle_count, due_date, line_items, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, 'USD', 'open', $5::date, $6, $7, $8::jsonb, NOW(), NOW())
     ON CONFLICT DO NOTHING
     RETURNING id, number, amount`,
    [
      subscription.tenant_id,
      subscription.id,
      number,
      amount,
      period,
      vehicleCount,
      dueDate,
      lineItems,
    ]
  );

  return rows[0] || null;
}

export async function generateMonthlyInvoices(runDate = new Date()) {
  const period = billingPeriod(runDate);
  const lockKey = period;

  logger.info('Starting monthly invoice generation', { period });

  const locked = await withTransaction(async (client) => {
    const acquired = await acquireJobLock(client, lockKey);
    if (!acquired) {
      logger.warn('Invoice generation already running or completed for this period', { period });
      return false;
    }
    return true;
  });

  if (!locked) {
    return { generated: 0, skipped: 0, errors: [], locked: true };
  }

  let generated = 0;
  let skipped = 0;
  const errors = [];

  const client = await (await import('./db.js')).pool.connect();

  try {
    const { rows: subscriptions } = await client.query(
      `SELECT id, tenant_id, plan_id
       FROM subscriptions
       WHERE status = 'active'
       ORDER BY id`
    );

    logger.info('Processing active subscriptions', { count: subscriptions.length, period });

    for (const subscription of subscriptions) {
      try {
        const exists = await invoiceExists(client, subscription.id, period);
        if (exists) {
          skipped++;
          continue;
        }

        const invoice = await createInvoice(client, subscription, period);
        if (invoice) {
          generated++;
          logger.info('Invoice created', {
            subscriptionId: subscription.id,
            tenantId: subscription.tenant_id,
            invoiceId: invoice.id,
            number: invoice.number,
            amount: invoice.amount,
          });
        } else {
          skipped++;
        }
      } catch (error) {
        errors.push({
          subscriptionId: subscription.id,
          tenantId: subscription.tenant_id,
          message: error.message,
        });
        logger.error('Failed to generate invoice for subscription', {
          subscriptionId: subscription.id,
          tenantId: subscription.tenant_id,
          error: error.message,
        });
      }
    }
  } finally {
    client.release();
    await withTransaction(async (tx) => releaseJobLock(tx, lockKey));
  }

  const summary = { generated, skipped, errors, period, locked: false };
  logger.info('Monthly invoice generation finished', summary);
  return summary;
}
