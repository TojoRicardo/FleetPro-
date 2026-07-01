import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { trackApiError } from '@/api/errorHandler';
import type { ApiResponse, PaginatedApiResponse, PaginatedResponse } from '@/types';
import { useAuthStore, useTenantStore } from '@/store';
import { ROUTES } from '@/routes/constants';
import { isGuestPath, navigateTo } from '@/routes/navigation';
import { env } from '@/config/env';

const API_BASE_URL = env.apiUrl;

function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const tenantId = useTenantStore.getState().selectedTenantId;
  if (tenantId != null) {
    config.headers['X-Tenant-Id'] = String(tenantId);
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config;

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      useTenantStore.getState().setTenant(null);
      useTenantStore.getState().selectTenant(null);
      if (!isGuestPath(window.location.pathname)) {
        navigateTo(ROUTES.LOGIN, { replace: true });
      }
      return Promise.reject(error);
    }

    trackApiError(error, original?.url);

    if (error.response?.status === 429 && original && !(original as InternalAxiosRequestConfig & { _retry?: boolean })._retry) {
      (original as InternalAxiosRequestConfig & { _retry?: boolean })._retry = true;
      await new Promise((r) => setTimeout(r, 1000));
      return apiClient(original);
    }

    return Promise.reject(error);
  }
);

export function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}

export function unwrapPaginated<T>(response: { data: PaginatedApiResponse<T> }): PaginatedResponse<T> {
  return {
    data: response.data.data,
    meta: response.data.meta,
  };
}

export default apiClient;
