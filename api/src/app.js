import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { sanitizeRequest } from './middleware/sanitizeRequest.js';
import { rejectSuspiciousRequest } from './middleware/rejectSuspiciousRequest.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { createCorsOriginCallback } from './lib/corsOrigins.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(securityHeaders);
  app.use(
    cors({
      origin: createCorsOriginCallback(env.corsOrigin),
      credentials: true,
    }),
  );
  app.use(apiRateLimiter);
  app.use(rejectSuspiciousRequest);
  app.use(express.json({ limit: '1mb' }));
  app.use(sanitizeRequest);

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
