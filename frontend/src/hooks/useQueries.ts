import { useQuery, useInfiniteQuery, useMutation, useQueryClient, keepPreviousData, type QueryClient } from '@tanstack/react-query';
import {
  vehiclesApi, driversApi, tripsApi, maintenanceApi, assignmentsApi,
  dashboardApi, billingApi, notificationsApi, analyticsApi, adminApi, lookupsApi, profileApi,
} from '@/api/endpoints';
import type { ListParams, PasswordUpdatePayload, ProfileUpdatePayload } from '@/types';
import { useAuthStore, useToastStore } from '@/store';
import { getApiErrorMessage } from '@/utils';

function buildListParams(params: ListParams): ListParams {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null),
  ) as ListParams;
}

async function refreshListQueries(qc: QueryClient, keys: string[], extras: string[] = []) {
  await Promise.all(
    [...keys, ...extras].map((key) => qc.invalidateQueries({ queryKey: [key] })),
  );
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getStatistics,
    refetchInterval: 60000,
    staleTime: 0,
  });
}

export function useTenantAnalytics() {
  return useQuery({ queryKey: ['analytics'], queryFn: analyticsApi.getTenantMetrics, staleTime: 60000 });
}

export function usePlatformAnalytics(enabled = true) {
  return useQuery({
    queryKey: ['platform-analytics'],
    queryFn: analyticsApi.getPlatformAnalytics,
    enabled,
    staleTime: 300000,
  });
}

export function useSubscription() {
  return useQuery({ queryKey: ['billing', 'subscription'], queryFn: billingApi.getSubscription });
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ per_page: 20 }),
    refetchInterval: 30000,
  });
  const unread = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 15000,
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAsRead = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return { list, unread, markAllRead, markAsRead };
}

export function useAuditLogs(params: ListParams) {
  const queryParams = buildListParams(params);
  return useQuery({
    queryKey: ['audit-logs', queryParams],
    queryFn: () => dashboardApi.getAuditLogs(queryParams),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
}

export function useAuditLogStats() {
  return useQuery({
    queryKey: ['audit-logs', 'stats'],
    queryFn: dashboardApi.getAuditLogStats,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useInfiniteAuditLogs(params: Omit<ListParams, 'page'>) {
  const queryParams = buildListParams(params);
  return useInfiniteQuery({
    queryKey: ['audit-logs', 'infinite', queryParams],
    queryFn: ({ pageParam = 1 }) =>
      dashboardApi.getAuditLogs({ ...queryParams, page: Number(pageParam), per_page: Number(params.per_page ?? 20) }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (!meta || meta.current_page >= meta.last_page) return undefined;
      return meta.current_page + 1;
    },
    staleTime: 30000,
  });
}

export function useExportAuditLogs() {
  const toast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (params: ListParams) => dashboardApi.exportAuditLogs(params),
    onError: () => toast('error', 'Export impossible.'),
  });
}

export function useAdminTenants(params: ListParams, enabled: boolean) {
  return useQuery({
    queryKey: ['admin-tenants', params],
    queryFn: () => adminApi.getTenants(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useVehicles(params: ListParams) {
  const queryParams = buildListParams(params);
  return useQuery({
    queryKey: ['vehicles', queryParams],
    queryFn: () => vehiclesApi.getAll(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useDrivers(params: ListParams) {
  const queryParams = buildListParams(params);
  return useQuery({
    queryKey: ['drivers', queryParams],
    queryFn: () => driversApi.getAll(queryParams),
  });
}

export function useTrips(params: ListParams) {
  const queryParams = buildListParams(params);
  return useQuery({
    queryKey: ['trips', queryParams],
    queryFn: () => tripsApi.getAll(queryParams),
  });
}

export function useMaintenance(params: ListParams) {
  const queryParams = buildListParams(params);
  return useQuery({
    queryKey: ['maintenance', queryParams],
    queryFn: () => maintenanceApi.getAll(queryParams),
  });
}

export function useAssignments(params: ListParams) {
  const queryParams = buildListParams(params);
  return useQuery({
    queryKey: ['assignments', queryParams],
    queryFn: () => assignmentsApi.getAll(queryParams),
  });
}

export function useLookups() {
  const vehicles = useQuery({ queryKey: ['lookups', 'vehicles'], queryFn: () => lookupsApi.vehicles({ status: 'active' }) });
  const drivers = useQuery({ queryKey: ['lookups', 'drivers'], queryFn: () => lookupsApi.drivers({ status: 'available' }) });
  return { vehicles, drivers };
}

export function useVehicleMutations() {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.addToast);

  const invalidate = () => refreshListQueries(qc, ['vehicles'], ['lookups', 'dashboard', 'analytics', 'audit-logs']);

  return {
    create: useMutation({
      mutationFn: vehiclesApi.create,
      onSuccess: async () => {
        await invalidate();
        toast('success', 'Vehicle created.');
      },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: number; data: Parameters<typeof vehiclesApi.update>[1] }) => vehiclesApi.update(id, data),
      onSuccess: async () => { await invalidate(); toast('success', 'Vehicle updated.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
    remove: useMutation({
      mutationFn: vehiclesApi.delete,
      onSuccess: async () => { await invalidate(); toast('success', 'Vehicle deleted.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
  };
}

export function useDriverMutations() {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.addToast);
  const invalidate = () => refreshListQueries(qc, ['drivers'], ['lookups', 'dashboard', 'analytics', 'audit-logs']);

  return {
    create: useMutation({
      mutationFn: driversApi.create,
      onSuccess: async () => { await invalidate(); toast('success', 'Driver created.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: number; data: Parameters<typeof driversApi.update>[1] }) => driversApi.update(id, data),
      onSuccess: async () => { await invalidate(); toast('success', 'Driver updated.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
    remove: useMutation({
      mutationFn: driversApi.delete,
      onSuccess: async () => { await invalidate(); toast('success', 'Driver deleted.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
  };
}

export function useTripMutations() {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.addToast);
  const invalidate = () => refreshListQueries(qc, ['trips'], ['dashboard', 'analytics', 'audit-logs']);

  return {
    create: useMutation({
      mutationFn: tripsApi.create,
      onSuccess: async () => { await invalidate(); toast('success', 'Trip created.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: number; data: Parameters<typeof tripsApi.update>[1] }) => tripsApi.update(id, data),
      onSuccess: async () => { await invalidate(); toast('success', 'Trip updated.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
    remove: useMutation({
      mutationFn: tripsApi.delete,
      onSuccess: async () => { await invalidate(); toast('success', 'Trip deleted.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
  };
}

export function useMaintenanceMutations() {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.addToast);
  const invalidate = () => refreshListQueries(qc, ['maintenance'], ['dashboard', 'analytics', 'audit-logs']);

  return {
    create: useMutation({
      mutationFn: maintenanceApi.create,
      onSuccess: async () => { await invalidate(); toast('success', 'Maintenance scheduled.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: number; data: Parameters<typeof maintenanceApi.update>[1] }) => maintenanceApi.update(id, data),
      onSuccess: async () => { await invalidate(); toast('success', 'Maintenance updated.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
    remove: useMutation({
      mutationFn: maintenanceApi.delete,
      onSuccess: async () => { await invalidate(); toast('success', 'Maintenance deleted.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
  };
}

export function useAssignmentMutations() {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.addToast);
  const invalidate = async () => refreshListQueries(qc, ['assignments', 'drivers', 'vehicles'], ['lookups', 'dashboard', 'analytics', 'audit-logs']);

  return {
    create: useMutation({
      mutationFn: assignmentsApi.create,
      onSuccess: async () => { await invalidate(); toast('success', 'Assignment created.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
    unassign: useMutation({
      mutationFn: assignmentsApi.unassign,
      onSuccess: async () => { await invalidate(); toast('success', 'Driver unassigned.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
    remove: useMutation({
      mutationFn: assignmentsApi.delete,
      onSuccess: async () => { await invalidate(); toast('success', 'Assignment removed.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: number; data: Parameters<typeof assignmentsApi.update>[1] }) => assignmentsApi.update(id, data),
      onSuccess: async () => { await invalidate(); toast('success', 'Assignment updated.'); },
      onError: (e) => toast('error', getApiErrorMessage(e)),
    }),
  };
}

export function useProfile() {
  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.addToast);
  const setUser = useAuthStore((s) => s.setUser);

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
    staleTime: 60_000,
  });

  const sessions = useQuery({
    queryKey: ['profile', 'sessions'],
    queryFn: profileApi.getSessions,
    staleTime: 30_000,
  });

  const activity = useQuery({
    queryKey: ['profile', 'activity'],
    queryFn: profileApi.getActivity,
    staleTime: 30_000,
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileUpdatePayload) => profileApi.update(data),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(['profile'], user);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast('success', 'Profil mis à jour.');
    },
    onError: (err) => toast('error', getApiErrorMessage(err, 'Impossible de mettre à jour le profil.')),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(['profile'], user);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast('success', 'Photo de profil mise à jour.');
    },
    onError: (err) => toast('error', getApiErrorMessage(err, 'Impossible de mettre à jour la photo.')),
  });

  const deleteAvatar = useMutation({
    mutationFn: () => profileApi.deleteAvatar(),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(['profile'], user);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast('success', 'Photo de profil supprimée.');
    },
    onError: (err) => toast('error', getApiErrorMessage(err, 'Impossible de supprimer la photo.')),
  });

  const updatePassword = useMutation({
    mutationFn: (data: PasswordUpdatePayload) => profileApi.updatePassword(data),
    onSuccess: () => toast('success', 'Mot de passe mis à jour.'),
    onError: (err) => toast('error', getApiErrorMessage(err, 'Impossible de modifier le mot de passe.')),
  });

  const revokeSession = useMutation({
    mutationFn: profileApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'sessions'] });
      toast('success', 'Session révoquée.');
    },
    onError: (err) => toast('error', getApiErrorMessage(err, 'Impossible de révoquer la session.')),
  });

  return { profile, sessions, activity, updateProfile, uploadAvatar, deleteAvatar, updatePassword, revokeSession };
}
