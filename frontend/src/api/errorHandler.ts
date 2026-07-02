import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types';

type ApiErrorPayload = {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  status?: number;
};

export function parseApiError(error: unknown, fallback = 'Something went wrong.'): ApiErrorPayload {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    const data = axiosError.response?.data;

    return {
      message: data?.message ?? fallback,
      code: data?.code,
      errors: data?.errors,
      status: axiosError.response?.status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: fallback };
}

export function trackApiError(error: unknown, context?: string): void {
  const parsed = parseApiError(error);
  console.error('[API Error]', context ?? 'request', parsed);
}
