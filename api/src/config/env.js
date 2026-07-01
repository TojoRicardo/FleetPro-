import dotenv from 'dotenv';
import { resolveCorsOrigin } from '../lib/corsOrigins.js';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET;
const corsOrigin = resolveCorsOrigin(process.env.CORS_ORIGIN, nodeEnv);
const bindHost =
  process.env.BIND_HOST ?? (nodeEnv === 'production' ? '0.0.0.0' : '127.0.0.1');

const WEAK_JWT_SECRETS = new Set(['change-me', 'change-me-to-a-long-random-secret', 'your_jwt_secret_here']);

if (nodeEnv === 'production' && (!jwtSecret || WEAK_JWT_SECRETS.has(jwtSecret))) {
  throw new Error('JWT_SECRET must be set to a strong value in production.');
}

if (nodeEnv === 'production' && corsOrigin === false) {
  throw new Error('CORS_ORIGIN must be set in production.');
}

export const env = {
  port: Number(process.env.PORT || 5000),
  bindHost,
  jwtSecret: jwtSecret || 'change-me',
  corsOrigin,
  invoiceCron: process.env.INVOICE_CRON || '5 0 1 * *',
  nodeEnv,
  isProduction: nodeEnv === 'production',
};
