import { AppError } from '../utils/AppError.js';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isProd = process.env.NODE_ENV === 'production';
  let statusCode = err.statusCode || 500;
  const code = err.code || (err.message === 'CORS origin not allowed' ? 'CORS_FORBIDDEN' : 'INTERNAL_ERROR');

  if (err.message === 'CORS origin not allowed') {
    statusCode = 403;
  }

  if (!isProd) {
    console.error('[API Error]', err);
  }

  const exposeMessage = !isProd || statusCode < 500;
  const message = exposeMessage
    ? err.message || 'Internal server error.'
    : 'Internal server error.';

  res.status(statusCode).json({
    success: false,
    message,
    code,
    errors: exposeMessage ? err.details ?? undefined : undefined,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
    code: 'NOT_FOUND',
  });
}
