const MAX_BODY_KEYS = 50;
const MAX_STRING_LENGTH = 10_000;

function sanitizeValue(value, depth = 0) {
  if (depth > 8) return undefined;
  if (value == null) return value;
  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH ? value.slice(0, MAX_STRING_LENGTH) : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.slice(0, MAX_BODY_KEYS).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).slice(0, MAX_BODY_KEYS);
    return Object.fromEntries(entries.map(([k, v]) => [k, sanitizeValue(v, depth + 1)]));
  }
  return undefined;
}

/** Trim oversized JSON bodies in development to reduce abuse surface. */
export function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}
