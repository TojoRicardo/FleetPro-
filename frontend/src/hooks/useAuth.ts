import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/endpoints';
import { useAuthStore, useTenantStore, useToastStore } from '@/store';
import { getApiErrorMessage } from '@/utils';

function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuthStore.persist.hasHydrated());
    return unsub;
  }, []);

  return hydrated;
}

export function useAuth() {
  const hydrated = useAuthHydrated();
  const { user, token, isAuthenticated, setAuth, setUser, logout, hasRole, isSuperAdmin } = useAuthStore();
  const { setTenant } = useTenantStore();
  const toast = useToastStore((s) => s.addToast);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (meQuery.data?.user) {
      setUser(meQuery.data.user);
      if (meQuery.data.tenant) setTenant(meQuery.data.tenant);
    }
  }, [meQuery.data, setUser, setTenant]);

  useEffect(() => {
    if (meQuery.isError) {
      logout();
      useTenantStore.getState().setTenant(null);
    }
  }, [meQuery.isError, logout]);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      if (data.user.tenant) setTenant(data.user.tenant);
      toast('success', 'Welcome back!');
    },
    onError: (err) => toast('error', getApiErrorMessage(err, 'Login failed.')),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      if (data.tenant) setTenant(data.tenant);
      toast('success', 'Organization created successfully!');
    },
    onError: (err) => toast('error', getApiErrorMessage(err, 'Registration failed.')),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try { await authApi.logout(); } catch { /* always clear session */ }
      logout();
    },
  });

  return {
    user: user ?? meQuery.data?.user ?? null,
    token,
    isAuthenticated: isAuthenticated && !!token,
    isHydrated: hydrated,
    isLoading: !hydrated || (!!token && meQuery.isLoading),
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    hasRole,
    isSuperAdmin,
    loginLoading: loginMutation.isPending,
    registerLoading: registerMutation.isPending,
  };
}
