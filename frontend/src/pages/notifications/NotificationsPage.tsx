import { useState } from 'react';
import { CheckCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import NotificationList from '@/components/notifications/NotificationList';
import NotificationDetailModal from '@/components/notifications/NotificationDetailModal';
import { useNotifications } from '@/hooks/useQueries';
import { getPaginatedRows } from '@/utils';
import { TOPBAR_COPY } from '@/i18n/fr';
import type { AppNotification } from '@/types';

export default function NotificationsPage() {
  const { list, unread, markAllRead, markAsRead } = useNotifications();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const notifications = getPaginatedRows(list.data);
  const unreadCount = unread.data?.count ?? 0;

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try {
      await markAsRead.mutateAsync(id);
      setSelectedNotification((current) =>
        current?.id === id ? { ...current, read_at: new Date().toISOString() } : current,
      );
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {unreadCount > 0 ? (
          <Badge variant="active" className="w-fit">
            {TOPBAR_COPY.notifications.unread(unreadCount)}
          </Badge>
        ) : (
          <span className="text-sm text-[var(--color-text-secondary)]">
            {TOPBAR_COPY.notifications.emptySubtitle}
          </span>
        )}

        {notifications.length > 0 && unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            loading={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            <span>{TOPBAR_COPY.notifications.markRead}</span>
          </Button>
        ) : null}
      </div>

      <NotificationList
        notifications={notifications}
        loading={list.isLoading}
        onMarkRead={handleMarkRead}
        onSelect={setSelectedNotification}
        markingId={markingId}
      />

      <NotificationDetailModal
        open={!!selectedNotification}
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onMarkRead={handleMarkRead}
        markingId={markingId}
      />
    </div>
  );
}
