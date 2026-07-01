export type UserRole = 'super_admin' | 'admin' | 'manager' | 'mechanic' | 'driver';

export interface User {
  id: number;
  tenant_id: number | null;
  name: string;
  username?: string | null;
  email: string;
  phone?: string | null;
  job_title?: string | null;
  department?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  status: 'active' | 'inactive';
  is_super_admin?: boolean;
  last_login_at?: string | null;
  created_at?: string;
  tenant?: Tenant;
}

export interface UserSession {
  id: number;
  name: string;
  is_current: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface ProfileUpdatePayload {
  name?: string;
  username?: string | null;
  phone?: string | null;
  job_title?: string | null;
  department?: string | null;
  avatar_url?: string | null;
}

export interface PasswordUpdatePayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  email?: string;
  plan_id?: number;
  status: 'active' | 'suspended' | 'trial';
  subscription?: Subscription;
  plan?: Plan;
}

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  price_monthly?: number;
  price_yearly?: number;
  vehicle_limit: number;
  max_vehicles?: number;
  max_users?: number;
  max_drivers?: number;
  features?: string[];
}

export interface Subscription {
  id: number;
  tenant_id: number;
  plan_id: number;
  status: 'active' | 'cancelled' | 'expired';
  start_date?: string;
  end_date?: string;
  plan?: Plan;
}

export interface Vehicle {
  id: number;
  tenant_id: number;
  plate_number: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  status: 'active' | 'maintenance' | 'inactive';
  created_at: string;
}

export type VehicleInput = Pick<Vehicle, 'plate_number' | 'brand' | 'model' | 'year' | 'mileage' | 'status'>;

export interface Driver {
  id: number;
  tenant_id: number;
  name: string;
  license_number: string;
  phone: string;
  status: 'available' | 'on_trip' | 'unavailable';
  score: number;
  created_at: string;
}

export interface Trip {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  driver_id: number;
  start_location: string;
  end_location: string;
  start_time: string;
  end_time?: string | null;
  distance: number;
  cost_estimation?: number | null;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  vehicle?: Vehicle;
  driver?: Driver;
  created_at: string;
}

export interface Maintenance {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  type: string;
  description: string;
  cost: number;
  maintenance_date: string;
  status: 'planned' | 'done' | 'cancelled';
  vehicle?: Vehicle;
  created_at: string;
}

export interface Assignment {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  driver_id: number;
  assigned_at: string;
  unassigned_at?: string | null;
  status: 'active' | 'ended';
  vehicle?: Vehicle;
  driver?: Driver;
}

export interface AuditLog {
  id: number;
  tenant_id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  before_value?: Record<string, unknown> | null;
  after_value?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  user_agent?: string | null;
  route?: string | null;
  created_at: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  entity?: string;
  result?: 'success' | 'failed' | 'partial';
  duration_ms?: number | null;
  session_id?: string;
  device_type?: string;
  resource_label?: string;
  resource_reference?: string | null;
  changed_fields_count?: number;
  changed_fields_preview?: {
    field: string;
    label: string;
    before: unknown;
    after: unknown;
  } | null;
}

export interface AuditLogStats {
  today_total: number;
  creates: number;
  updates: number;
  deletes: number;
  failures: number;
}

export interface AppNotification {
  id: string;
  tenant_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  read_at?: string | null;
  created_at: string;
}

export interface Invoice {
  id: number;
  tenant_id: number;
  subscription_id?: number | null;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'unpaid' | 'overdue';
  billing_period?: string | null;
  vehicle_count?: number | null;
  due_date?: string | null;
  paid_at?: string | null;
  line_items?: Array<{ description: string; amount: number; quantity?: number; unit_price?: number }>;
  payments?: Payment[];
  created_at: string;
  updated_at?: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string | null;
  created_at: string;
}

export interface BillingRevenue {
  total_revenue: number;
  pending_amount: number;
  overdue_amount: number;
  paid_this_month: number;
  currency: string;
}

export interface DashboardStatistics {
  total_vehicles: number;
  active_vehicles: number;
  vehicles_in_maintenance: number;
  total_drivers: number;
  active_drivers: number;
  total_trips: number;
  ongoing_trips: number;
  total_maintenance_cost: number;
}

export interface DashboardCharts {
  vehicle_status: { active: number; maintenance: number; inactive: number };
  trip_status: { scheduled: number; ongoing: number; completed: number; cancelled: number };
}

export interface DashboardPayload {
  statistics: DashboardStatistics;
  charts: DashboardCharts;
  meta?: { cached_at: string; generated_at: string };
}

export interface TenantMetrics {
  vehicles_count: number;
  drivers_count: number;
  trips_count: number;
  active_trips: number;
  maintenance_count: number;
  maintenance_cost: number;
}

export interface PlatformAnalytics {
  total_tenants: number;
  active_tenants: number;
  active_subscriptions: number;
  mrr: number;
  total_vehicles: number;
  usage_by_plan: { plan: string; slug: string; active_subscriptions: number }[];
}

export interface BillingUsage {
  vehicles: { used: number; limit: number };
  users: { used: number; limit: number };
  drivers: { used: number; limit: number };
}

export interface PaginatedMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  code?: string;
  data: T;
  errors?: Record<string, string[]>;
}

/** Laravel paginated JSON: items in `data`, pagination in sibling `meta`. */
export interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginatedMeta;
}

export interface LoginResponse {
  user: User;
  token: string;
  expires_at?: string;
  tenant?: Tenant;
}

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  [key: string]: string | number | undefined;
}
