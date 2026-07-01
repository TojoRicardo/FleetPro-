import { logger } from './logger.js';

const JOB_NAME = 'monthly_invoice_generation';

export async function acquireJobLock(client, lockKey) {
  const ttlMinutes = Number(process.env.JOB_LOCK_TTL_MINUTES || 120);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await client.query(
    `DELETE FROM billing_job_locks
     WHERE job_name = $1 AND expires_at < NOW()`,
    [JOB_NAME]
  );

  const result = await client.query(
    `INSERT INTO billing_job_locks (job_name, lock_key, locked_at, expires_at, created_at, updated_at)
     VALUES ($1, $2, NOW(), $3, NOW(), NOW())
     ON CONFLICT (job_name, lock_key) DO NOTHING
     RETURNING id`,
    [JOB_NAME, lockKey, expiresAt]
  );

  return result.rowCount > 0;
}

export async function releaseJobLock(client, lockKey) {
  await client.query(
    `DELETE FROM billing_job_locks WHERE job_name = $1 AND lock_key = $2`,
    [JOB_NAME, lockKey]
  );
  logger.debug('Job lock released', { lockKey });
}
