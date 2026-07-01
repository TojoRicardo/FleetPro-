import { parseApiError } from '@/api/errorHandler';
import { clsx, type ClassValue } from 'clsx';
import type { PaginatedResponse } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Normalise paginated API results (handles legacy cached array shape). */
export function getPaginatedRows<T>(result: PaginatedResponse<T> | T[] | null | undefined): T[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  return [];
}

export function getPaginatedMeta<T>(result: PaginatedResponse<T> | T[] | null | undefined) {
  if (!result || Array.isArray(result)) return undefined;
  return result.meta;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  return parseApiError(error, fallback).message;
}

export function getApiValidationErrors(error: unknown): Record<string, string> | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null;
  const axiosError = error as { response?: { data?: { errors?: Record<string, string[]> } } };
  const errors = axiosError.response?.data?.errors;
  if (!errors) return null;
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, messages[0] ?? 'Invalid value.']),
  );
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString();
}

export const DEFAULT_PAGE_SIZE = 15;

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  maintenance: 'bg-amber-100 text-amber-700',
  inactive: 'bg-slate-100 text-slate-600',
  available: 'bg-emerald-100 text-emerald-700',
  on_trip: 'bg-blue-100 text-blue-700',
  unavailable: 'bg-red-100 text-red-700',
  scheduled: 'bg-slate-100 text-slate-600',
  ongoing: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  planned: 'bg-blue-100 text-blue-700',
  done: 'bg-emerald-100 text-emerald-700',
  paid: 'bg-emerald-100 text-emerald-700',
  open: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  draft: 'bg-slate-100 text-slate-600',
  void: 'bg-slate-100 text-slate-500',
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-amber-100 text-amber-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-blue-100 text-blue-700',
};


function getMediaOrigin(): string {
  const api = import.meta.env.VITE_API_URL || '/api/v1';
  if (api.startsWith('http')) {
    return api.replace(/\/api\/v1\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

/** Resolve avatar/document URLs returned as relative /storage/... paths. */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/storage/')) {
        return `${getMediaOrigin()}${parsed.pathname}`;
      }
      return url;
    } catch {
      return null;
    }
  }

  const path = url.startsWith('/') ? url : `/${url}`;
  return `${getMediaOrigin()}${path}`;
}
