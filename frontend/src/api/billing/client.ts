import { getApiErrorMessage } from '@/utils';

export function getBillingErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  return getApiErrorMessage(error, fallback);
}
