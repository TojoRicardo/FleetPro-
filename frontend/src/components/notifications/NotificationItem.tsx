import { Check } from 'lucide-react';
import { cn } from '@/utils';
import { TOPBAR_COPY } from '@/i18n/fr';
import {
  formatRelativeTime,
  getNotificationVisual,
  isUnread,
} from '@/components/notifications/notificationUtils';
import type { AppNotification } from '@/types';

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead?: (id: string) => void;
  onSelect?: (notification: AppNotification) => void;
  compact?: boolean;
  markingId?: string | null;
}

export default function NotificationItem({
  notification,
  onMarkRead,
  onSelect,
  compact = false,
  markingId = null,
}: NotificationItemProps) {
  const unread = isUnread(notification);
  const visual = getNotificationVisual(notification.type);
  const Icon = visual.icon;
  const isMarking = markingId === notification.id;
  const selectable = !!onSelect;

  const handleActivate = () => {
    onSelect?.(notification);
  };

  return (
    <article
      className={cn(
        'group relative transition-colors duration-200',
        compact
          ? 'border-b border-[var(--border)] px-4 py-3.5 sm:px-5'
          : 'rounded-xl border border-[var(--border)] bg-[var(--card)] p-4',
        unread && 'bg-[var(--color-accent-muted)]/30',
        unread && !compact && 'border-l-[3px] border-l-primary-500',
        selectable && 'cursor-pointer hover:bg-[var(--color-surface-secondary)]/80',
      )}
      onClick={selectable ? handleActivate : undefined}
      onKeyDown={
        selectable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleActivate();
              }
            }
          : undefined
      }
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            visual.bgClass,
          )}
        >
          <Icon className={cn('h-4 w-4', visual.iconClass)} aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text)]">{notification.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {notification.message}
              </p>
            </div>
            <time
              dateTime={notification.created_at}
              className="shrink-0 text-[11px] text-[var(--color-text-secondary)]"
              title={notification.created_at}
            >
              {formatRelativeTime(notification.created_at)}
            </time>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-surface-secondary)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
              {visual.label}
            </span>
            {unread && onMarkRead ? (
              <button
                type="button"
                disabled={isMarking}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium text-primary-600 opacity-0 transition-opacity hover:bg-primary-50 group-hover:opacity-100 dark:hover:bg-primary-500/10"
              >
                <Check className="h-3 w-3" />
                {TOPBAR_COPY.notifications.markOneRead}
              </button>
            ) : null}
          </div>
        </div>

        {unread ? (
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-hidden />
        ) : null}
      </div>
    </article>
  );
}
