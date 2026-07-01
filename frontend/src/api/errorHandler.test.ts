import { describe, it, expect } from 'vitest';
import { parseApiError } from '@/api/errorHandler';

describe('parseApiError', () => {
  it('returns fallback for unknown errors', () => {
    expect(parseApiError(null).message).toBe('Something went wrong.');
  });

  it('extracts message and code from axios error shape', () => {
    const error = {
      response: {
        status: 422,
        data: {
          success: false,
          message: 'Validation failed.',
          code: 'VALIDATION_FAILED',
          errors: { email: ['Invalid email'] },
        },
      },
    };
    const parsed = parseApiError(error);
    expect(parsed.message).toBe('Validation failed.');
    expect(parsed.code).toBe('VALIDATION_FAILED');
    expect(parsed.status).toBe(422);
  });
});
