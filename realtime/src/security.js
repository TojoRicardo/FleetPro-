const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

export function isLocalhostOrigin(origin) {
  return typeof origin === 'string' && LOCALHOST_ORIGIN_RE.test(origin);
}

export function filterLocalhostOrigins(origins) {
  return origins.filter(isLocalhostOrigin);
}

export function parseAllowedOrigins(raw, nodeEnv = 'development') {
  const origins = (raw ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (nodeEnv !== 'production') {
    const safe = origins.length > 0 ? filterLocalhostOrigins(origins) : DEFAULT_DEV_ORIGINS;
    return safe.length > 0 ? safe : DEFAULT_DEV_ORIGINS;
  }

  return origins.length > 0 ? origins : [];
}

export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
}

export function corsOriginValidator(allowedOrigins) {
  return (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin not allowed'));
  };
}

/** Restrict internal broadcast endpoint to loopback in development. */
export function requireLocalInternalRequest(req, res, next) {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    return next();
  }

  const ip = req.socket?.remoteAddress ?? '';
  const isLoopback =
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1';

  if (!isLoopback) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
}
