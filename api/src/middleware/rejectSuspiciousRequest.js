import { AppError } from '../utils/AppError.js';

const MAX_URL_LENGTH = 2048;
const SUSPICIOUS_PATH_RE = /(\.\.|%2e%2e|%00|\\x00)/i;

/** Reject obviously malformed or abusive requests before route handlers run. */
export function rejectSuspiciousRequest(req, _res, next) {
  const url = req.originalUrl ?? req.url ?? '';

  if (url.length > MAX_URL_LENGTH) {
    return next(new AppError('Request URI too long.', 414, 'URI_TOO_LONG'));
  }

  if (SUSPICIOUS_PATH_RE.test(url)) {
    return next(new AppError('Malformed request.', 400, 'BAD_REQUEST'));
  }

  const contentLength = Number(req.headers['content-length'] ?? 0);
  if (contentLength > 1_048_576) {
    return next(new AppError('Payload too large.', 413, 'PAYLOAD_TOO_LARGE'));
  }

  const method = req.method?.toUpperCase();
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentType = req.headers['content-type'] ?? '';
    if (contentType && !contentType.startsWith('application/json') && !contentType.startsWith('multipart/form-data')) {
      return next(new AppError('Unsupported content type.', 415, 'UNSUPPORTED_MEDIA_TYPE'));
    }
  }

  return next();
}
