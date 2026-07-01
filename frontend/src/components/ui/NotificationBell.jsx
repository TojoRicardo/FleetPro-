import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, X, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  subscribeToNotifications,
} from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { useTenantStore } from '@/store';
import { getApiErrorMessage } from '@/utils';
import NotificationList from '@/components/notifications/NotificationList';
import NotificationDetailModal from '@/components/notifications/NotificationDetailModal';
import Portal from '@/components/ui/Portal';
import { useScrollLock } from '@/hooks/useScrollLock';
import { TOPBAR_COPY } from '@/i18n/fr';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const mountedRef = useRef(true);

  const { user, token } = useAuth();
  const tenant = useTenantStore((s) => s.tenant);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    setSelectedNotification(null);
  }, [location.pathname]);

  const refresh = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [listResult, unreadResult] = await Promise.all([
        getNotifications({ per_page: 20 }),
        getUnreadCount(),
      ]);

      if (!mountedRef.current) return;

      setNotifications(Array.isArray(listResult?.data) ? listResult.data : []);
      setUnreadCount(unreadResult?.count ?? 0);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(getApiErrorMessage(err, TOPBAR_COPY.notifications.loadError));
      setNotifications([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    mountedRef.current = true;
    refresh();

    const unsubscribe = subscribeToNotifications({
      tenantId: tenant?.id,
      userId: user?.id,
      onNotification: refresh,
    });

    const pollId = setInterval(refresh, 30000);

    return () => {
      mountedRef.current = false;
      unsubscribe?.();
      clearInterval(pollId);
    };
  }, [refresh, tenant?.id, user?.id, token]);

  useScrollLock(open && !selectedNotification);

  useEffect(() => {
    if (!open || selectedNotification) return;
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, selectedNotification]);

  useEffect(() => {
    if (open && token) {
      refresh();
    }
  }, [open, token, refresh]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      await refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, TOPBAR_COPY.notifications.markError));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id) => {
    setMarkingId(id);
    try {
      await markAsRead(id);
      await refresh();
      setSelectedNotification((current) =>
        current?.id === id ? { ...current, read_at: new Date().toISOString() } : current,
      );
    } catch (err) {
      setError(getApiErrorMessage(err, TOPBAR_COPY.notifications.markError));
    } finally {
      setMarkingId(null);
    }
  };

  const handleSelectNotification = (notification) => {
    setSelectedNotification(notification);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative rounded-xl p-2 text-[var(--color-text-secondary)] transition-all duration-300 hover:bg-[var(--color-surface-secondary)] hover:text-[var(--text)] focus-ring"
        aria-label={TOPBAR_COPY.notifications.aria}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[var(--card)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      <Portal>
        {open ? (
          <div className="fixed inset-0 z-[var(--z-modal,150)]">
            <div
              className="absolute inset-0 modal-overlay"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={TOPBAR_COPY.notifications.title}
              className="absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--card)] shadow-2xl transition-colors duration-300"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-[var(--text)]">{TOPBAR_COPY.notifications.title}</h3>
                  {unreadCount > 0 ? (
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {TOPBAR_COPY.notifications.unread(unreadCount)}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {TOPBAR_COPY.notifications.emptySubtitle}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={markingAll}
                      className="rounded-xl p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-secondary)] hover:text-[var(--text)] disabled:opacity-50"
                      aria-label={TOPBAR_COPY.notifications.markRead}
                      title={TOPBAR_COPY.notifications.markRead}
                    >
                      <CheckCheck className={`h-5 w-5 ${markingAll ? 'animate-pulse' : ''}`} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors duration-300"
                    aria-label="Fermer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <NotificationList
                  notifications={notifications}
                  loading={loading}
                  error={error}
                  compact
                  onMarkRead={handleMarkRead}
                  onSelect={handleSelectNotification}
                  markingId={markingId}
                />
              </div>

              <div className="shrink-0 border-t border-[var(--border)] p-4">
                <Link
                  to="/notifications"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl bg-[var(--color-surface-secondary)] py-2.5 text-sm font-medium text-[var(--text)] transition-colors duration-300 hover:bg-[var(--color-accent-muted)]"
                >
                  {TOPBAR_COPY.notifications.viewAll}
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </Portal>

      <NotificationDetailModal
        open={!!selectedNotification}
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onMarkRead={handleMarkRead}
        markingId={markingId}
      />
    </>
  );
}
