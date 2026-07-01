import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearAppData } from '@/lib/clearAppData';
import type { Tenant, User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
  isSuperAdmin: () => boolean;
}

export function resetAllClientData(): void {
  clearAppData();
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  useTenantStore.setState({ tenant: null, selectedTenantId: null });
  useUIStore.setState({ sidebarCollapsed: false, dismissedTips: [] });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        resetAllClientData();
      },
      hasRole: (...roles) => {
        const user = get().user;
        if (!user) return false;
        if (user.is_super_admin || user.role === 'super_admin') return true;
        return roles.includes(user.role);
      },
      isSuperAdmin: () => {
        const user = get().user;
        return user?.is_super_admin === true || user?.role === 'super_admin';
      },
    }),
    {
      name: 'fleetpro-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

interface TenantState {
  tenant: Tenant | null;
  selectedTenantId: number | null;
  setTenant: (tenant: Tenant | null) => void;
  selectTenant: (tenantId: number | null) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      tenant: null,
      selectedTenantId: null,
      setTenant: (tenant) => set({ tenant }),
      selectTenant: (tenantId) => {
        set({ selectedTenantId: tenantId });
      },
    }),
    { name: 'fleetpro-tenant' }
  )
);

interface UIState {
  sidebarCollapsed: boolean;
  dismissedTips: string[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  dismissTip: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      dismissedTips: [],
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      dismissTip: (id) => set({ dismissedTips: [...get().dismissedTips, id] }),
    }),
    { name: 'fleetpro-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, dismissedTips: s.dismissedTips }) }
  )
);

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
