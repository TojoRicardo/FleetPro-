import { Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import NotificationItem from '@/components/notifications/NotificationItem';
import { groupNotificationsByDay } from '@/components/notifications/notificationUtils';
import { TOPBAR_COPY } from '@/i18n/fr';
import type { AppNotification } from '@/types';

interface NotificationListProps {
  notifications: AppNotification[];
  loading?: boolean;
  error?: string | null;
  compact?: boolean;
  onMarkRead?: (id: string) => void;
  onSelect?: (notification: AppNotification) => void;
  markingId?: string | null;
}

export default function NotificationList({
  notifications,
  loading = false,
  error = null,
  compact = false,
  onMarkRead,
  onSelect,
  markingId = null,
}: NotificationListProps) {
  if (loading) {
    return (
      <div className={compact ? 'divide-y divide-[var(--border)]' : 'space-y-3'}>
        {Array.from({ length: compact ? 4 : 3 }).map((_, i) => (
          <div key={i} className={compact ? 'px-4 py-4 sm:px-5' : 'rounded-xl border border-[var(--border)] p-4'}>
            <div className="flex gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={compact ? 'mx-4 mt-4 sm:mx-5' : ''}>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-secondary)]">
          <Bell className="h-7 w-7 text-[var(--color-text-secondary)]" />
        </div>
        <p className="font-medium text-[var(--text)]">{TOPBAR_COPY.notifications.emptyTitle}</p>
        <p className="mt-1 max-w-xs text-sm text-[var(--color-text-secondary)]">
          {compact
            ? TOPBAR_COPY.notifications.emptySubtitle
            : TOPBAR_COPY.notifications.emptyPageDescription}
        </p>
      </div>
    );
  }

  const grouped = groupNotificationsByDay(notifications);

  return (
    <div className={compact ? '' : 'space-y-6'}>
      {Object.entries(grouped).map(([day, items]) => (
        <section key={day}>
          <p
            className={
              compact
                ? 'sticky top-0 z-[1] bg-[var(--card)]/95 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] backdrop-blur-sm sm:px-5'
                : 'mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]'
            }
          >
            {day}
          </p>
          <div className={compact ? '' : 'space-y-2'}>
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                compact={compact}
                onMarkRead={onMarkRead}
                onSelect={onSelect}
                markingId={markingId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
