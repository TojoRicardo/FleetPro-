import cron from 'node-cron';
import dotenv from 'dotenv';
import { pool } from './db.js';
import { logger } from './logger.js';
import { generateMonthlyInvoices } from './invoiceGenerator.js';

dotenv.config();

const CRON_EXPR = process.env.INVOICE_CRON || '5 0 1 * *';
const runNow = process.argv.includes('--run-now');

async function runJob() {
  try {
    await generateMonthlyInvoices(new Date());
  } catch (error) {
    logger.error('Invoice generation job failed', { error: error.message, stack: error.stack });
    process.exitCode = 1;
  }
}

if (runNow) {
  logger.info('Running invoice generation immediately');
  await runJob();
  await pool.end();
  process.exit(process.exitCode || 0);
}

if (!cron.validate(CRON_EXPR)) {
  logger.error('Invalid cron expression', { expression: CRON_EXPR });
  process.exit(1);
}

logger.info('FleetPro billing worker started', { cron: CRON_EXPR });

cron.schedule(CRON_EXPR, runJob, { timezone: 'UTC' });

process.on('SIGINT', async () => {
  logger.info('Shutting down billing worker');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down billing worker');
  await pool.end();
  process.exit(0);
});
