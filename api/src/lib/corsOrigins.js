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

export function resolveCorsOrigin(raw, nodeEnv = 'development') {
  const origins = (raw ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (nodeEnv !== 'production') {
    const safe = origins.length > 0 ? filterLocalhostOrigins(origins) : DEFAULT_DEV_ORIGINS;
    return safe.length > 0 ? safe : DEFAULT_DEV_ORIGINS;
  }

  return origins.length > 0 ? origins : false;
}

export function createCorsOriginCallback(allowedOrigins) {
  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin not allowed'));
  };
}
