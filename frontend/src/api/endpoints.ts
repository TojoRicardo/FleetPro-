import apiClient, { unwrap, unwrapPaginated } from './client';
import type {
  ApiResponse,
  Assignment,
  AuditLog,
  AuditLogStats,
  BillingUsage,
  BillingRevenue,
  DashboardPayload,
  Driver,
  Invoice,
  Payment,
  ListParams,
  LoginResponse,
  Maintenance,
  PaginatedApiResponse,
  PasswordUpdatePayload,
  Plan,
  PlatformAnalytics,
  ProfileUpdatePayload,
  AppNotification,
  Subscription,
  Tenant,
  TenantMetrics,
  Trip,
  User,
  UserSession,
  Vehicle,
  VehicleInput,
} from '@/types';

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<ApiResponse<LoginResponse>>('/login', credentials).then(unwrap),
  register: (data: { name: string; email: string; password: string; password_confirmation: string; company_name: string }) =>
    apiClient.post<ApiResponse<LoginResponse>>('/register', data).then(unwrap),
  logout: () => apiClient.post('/logout'),
  me: () => apiClient.get<ApiResponse<{ user: User; tenant?: Tenant; subscription?: Subscription; plan?: Plan }>>('/me').then(unwrap),
};

export const profileApi = {
  get: () => apiClient.get<ApiResponse<User>>('/profile').then(unwrap),
  update: (data: ProfileUpdatePayload) => apiClient.put<ApiResponse<User>>('/profile', data).then(unwrap),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return apiClient.post<ApiResponse<User>>('/profile/avatar', form).then(unwrap);
  },
  deleteAvatar: () => apiClient.delete<ApiResponse<User>>('/profile/avatar').then(unwrap),
  updatePassword: (data: PasswordUpdatePayload) => apiClient.put<ApiResponse<null>>('/profile/password', data).then(unwrap),
  getSessions: () => apiClient.get<ApiResponse<UserSession[]>>('/profile/sessions').then(unwrap),
  getActivity: () => apiClient.get<ApiResponse<AuditLog[]>>('/profile/activity').then(unwrap),
  revokeSession: (tokenId: number) => apiClient.delete<ApiResponse<null>>(`/profile/sessions/${tokenId}`).then(unwrap),
};

export const dashboardApi = {
  getStatistics: () => apiClient.get<ApiResponse<DashboardPayload>>('/dashboard').then(unwrap),
  getAuditLogs: (params?: ListParams) =>
    apiClient.get<PaginatedApiResponse<AuditLog>>('/audit-logs', { params }).then(unwrapPaginated),
  getAuditLogStats: () => apiClient.get<ApiResponse<AuditLogStats>>('/audit-logs/stats').then(unwrap),
  exportAuditLogs: (params?: ListParams) =>
    apiClient.get<ApiResponse<AuditLog[]>>('/audit-logs/export', { params }).then(unwrap),
};

export const analyticsApi = {
  getTenantMetrics: () => apiClient.get<ApiResponse<TenantMetrics>>('/analytics').then(unwrap),
  getPlatformAnalytics: () => apiClient.get<ApiResponse<PlatformAnalytics>>('/admin/analytics').then(unwrap),
};

export const billingApi = {
  getSubscription: () =>
    apiClient.get<ApiResponse<{ subscription: Subscription | null; usage: BillingUsage }>>('/billing/subscription').then(unwrap),
  getPlans: () => apiClient.get<ApiResponse<Plan[]>>('/billing/plans').then(unwrap),
  subscribe: (data: { plan_id: number; billing_cycle?: string }) =>
    apiClient.post<ApiResponse<Subscription>>('/billing/subscribe', data).then(unwrap),
  getRevenue: () => apiClient.get<ApiResponse<BillingRevenue>>('/billing/revenue').then(unwrap),
  getInvoices: (params?: ListParams & { status?: string }) =>
    apiClient.get<PaginatedApiResponse<Invoice>>('/billing/invoices', { params }).then(unwrapPaginated),
  getInvoice: (id: number) => apiClient.get<ApiResponse<Invoice>>(`/billing/invoices/${id}`).then(unwrap),
  payInvoice: (id: number, data: { payment_method: string; idempotency_key?: string }) =>
    apiClient.post<ApiResponse<{ payment: Payment; invoice: Invoice; replayed: boolean }>>(
      `/billing/invoices/${id}/pay`,
      data,
      { headers: data.idempotency_key ? { 'Idempotency-Key': data.idempotency_key } : undefined },
    ).then(unwrap),
};

export const notificationsApi = {
  getAll: (params?: ListParams) =>
    apiClient.get<PaginatedApiResponse<AppNotification>>('/notifications', { params }).then(unwrapPaginated),
  getUnreadCount: () => apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count').then(unwrap),
  markAsRead: (id: string) => apiClient.post(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.post('/notifications/read-all'),
};

export const adminApi = {
  getTenants: (params?: ListParams) =>
    apiClient.get<PaginatedApiResponse<Tenant>>('/admin/tenants', { params }).then(unwrapPaginated),
  suspendTenant: (id: number) => apiClient.post(`/admin/tenants/${id}/suspend`),
  activateTenant: (id: number) => apiClient.post(`/admin/tenants/${id}/activate`),
};

export const lookupsApi = {
  vehicles: (params?: { status?: string }) =>
    apiClient.get<ApiResponse<Vehicle[]>>('/lookups/vehicles', { params }).then(unwrap),
  drivers: (params?: { status?: string }) =>
    apiClient.get<ApiResponse<Driver[]>>('/lookups/drivers', { params }).then(unwrap),
};

function createCrudApi<T>(path: string) {
  return {
    getAll: (params?: ListParams) =>
      apiClient.get<PaginatedApiResponse<T>>(path, { params }).then(unwrapPaginated),
    getById: (id: number) => apiClient.get<ApiResponse<T>>(`${path}/${id}`).then(unwrap),
    create: (data: Partial<T>) => apiClient.post<ApiResponse<T>>(path, data).then(unwrap),
    update: (id: number, data: Partial<T>) => apiClient.put<ApiResponse<T>>(`${path}/${id}`, data).then(unwrap),
    delete: (id: number) => apiClient.delete(`${path}/${id}`),
  };
}

export const vehiclesApi = {
  ...createCrudApi<Vehicle>('/vehicles'),
  create: (data: VehicleInput) => apiClient.post<ApiResponse<Vehicle>>('/vehicles', data).then(unwrap),
  update: (id: number, data: Partial<VehicleInput>) =>
    apiClient.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, data).then(unwrap),
};
export const driversApi = createCrudApi<Driver>('/drivers');
export const tripsApi = createCrudApi<Trip>('/trips');
export const maintenanceApi = createCrudApi<Maintenance>('/maintenance');

export const assignmentsApi = {
  ...createCrudApi<Assignment>('/assignments'),
  unassign: (id: number) => apiClient.post(`/assignments/${id}/unassign`),
};
