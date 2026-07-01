import cron from 'node-cron';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { generateMonthlyInvoices } from './services/invoiceGeneration.service.js';

const app = createApp();

async function runInvoiceJob() {
  try {
    const result = await generateMonthlyInvoices(new Date());
    if (env.nodeEnv !== 'production') {
      process.stdout.write(`[cron] Invoice generation finished ${JSON.stringify(result)}\n`);
    }
  } catch (error) {
    process.stderr.write(`[cron] Invoice generation failed ${error instanceof Error ? error.message : String(error)}\n`);
  }
}

if (cron.validate(env.invoiceCron)) {
  cron.schedule(env.invoiceCron, runInvoiceJob, { timezone: 'UTC' });
  if (env.nodeEnv !== 'production') {
    process.stdout.write(`[cron] Scheduled monthly invoices: ${env.invoiceCron} UTC\n`);
  }
} else if (env.nodeEnv !== 'production') {
  process.stderr.write('[cron] Invalid INVOICE_CRON expression\n');
}

app.listen(env.port, env.bindHost, () => {
  if (env.nodeEnv !== 'production') {
    process.stdout.write(
      `FleetPro Billing API listening on http://${env.bindHost}:${env.port}\n`,
    );
  }
});
