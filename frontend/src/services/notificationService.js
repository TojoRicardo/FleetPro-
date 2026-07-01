import apiClient, { unwrap } from '@/api/client';
import { subscribeToRealtime } from '@/lib/realtime';

export async function getNotifications(params = { per_page: 20 }) {
  return apiClient.get('/notifications', { params }).then(unwrap);
}

export async function getUnreadCount() {
  return apiClient.get('/notifications/unread-count').then(unwrap);
}

export async function markAsRead(id) {
  return apiClient.post(`/notifications/${id}/read`);
}

export async function markAllAsRead() {
  return apiClient.post('/notifications/read-all');
}

/**
 * Subscribe to realtime notification events. Returns an unsubscribe function.
 */
export function subscribeToNotifications({ tenantId, userId, onNotification } = {}) {
  return subscribeToRealtime({
    tenantId,
    userId,
    eventHandlers: {
      'notification.sent': () => {
        if (typeof onNotification === 'function') onNotification();
      },
    },
    onEvent: (type) => {
      if (type === 'notification.sent' && typeof onNotification === 'function') {
        onNotification();
      }
    },
  });
}

export const notificationService = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
};

/** @deprecated Use named exports from this module instead. */
export const notificationApiService = notificationService;

export default notificationService;
