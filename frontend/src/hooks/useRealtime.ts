import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useTenantStore, useToastStore } from '@/store';
import { isRealtimeEnabled, subscribeToRealtime } from '@/lib/realtime';

export function useRealtime() {
  const queryClient = useQueryClient();
  const tenant = useTenantStore((s) => s.tenant);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const toast = useToastStore((s) => s.addToast);

  const invalidateQueries = useCallback(
    (keys: string[], notify?: string) => {
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      if (notify) toast('info', notify);
    },
    [queryClient, toast]
  );

  useEffect(() => {
    if (!isRealtimeEnabled() || !token || (!tenant?.id && !user?.id)) return;

    const handlers: Record<string, () => void> = {
      'dashboard.updated': () => invalidateQueries(['dashboard', 'analytics'], 'Dashboard updated'),
      'vehicle.created': () => invalidateQueries(['vehicles', 'dashboard', 'audit-logs']),
      'vehicle.updated': () => invalidateQueries(['vehicles', 'dashboard', 'audit-logs']),
      'vehicle.assigned': () => invalidateQueries(['assignments', 'vehicles', 'drivers'], 'Assignment updated'),
      'trip.started': () => invalidateQueries(['trips', 'dashboard'], 'Trip started'),
      'trip.completed': () => invalidateQueries(['trips', 'dashboard'], 'Trip completed'),
      'maintenance.scheduled': () => invalidateQueries(['maintenance', 'dashboard']),
      'notification.sent': () => invalidateQueries(['notifications'], 'New notification'),
    };

    return subscribeToRealtime({
      tenantId: tenant?.id,
      userId: user?.id,
      eventHandlers: handlers,
    });
  }, [tenant?.id, user?.id, token, invalidateQueries]);
}

export function usePollingFallback(queryKeys: string[], intervalMs = 60000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = setInterval(() => {
      queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    }, intervalMs);
    return () => clearInterval(id);
  }, [queryClient, queryKeys, intervalMs]);
}
