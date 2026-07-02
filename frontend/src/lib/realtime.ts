import { io, type Socket } from 'socket.io-client';
import { env } from '@/config/env';

/** Realtime is opt-in — set VITE_ENABLE_WS=true and run a Socket.IO server on VITE_WS_URL. */
export function isRealtimeEnabled(): boolean {
  return env.enableWs && env.wsUrl.length > 0;
}

type RealtimeSubscribeOptions = {
  tenantId?: number | string | null;
  userId?: number | string | null;
  eventHandlers?: Record<string, () => void>;
};

/**
 * Subscribe to realtime events. Returns an unsubscribe function.
 * No-ops when VITE_ENABLE_WS is not true (polling handles updates instead).
 */
export function subscribeToRealtime({
  tenantId,
  userId,
  eventHandlers = {},
}: RealtimeSubscribeOptions = {}): () => void {
  if (!isRealtimeEnabled()) {
    return () => {};
  }

  let socket: Socket | null = null;

  try {
    if (import.meta.env.DEV && env.wsUrl && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(env.wsUrl)) {
      return () => {};
    }

    socket = io(env.wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
    });

    socket.on('connect', () => {
      if (tenantId) socket?.emit('subscribe', { channel: `tenant.${tenantId}` });
      if (userId) socket?.emit('subscribe', { channel: `user.${userId}` });
    });

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket?.on(event, handler);
    });
  } catch {
    // WebSocket unavailable — caller can fall back to polling
  }

  return () => {
    if (socket?.connected) {
      socket.disconnect();
    }
    socket = null;
  };
}
