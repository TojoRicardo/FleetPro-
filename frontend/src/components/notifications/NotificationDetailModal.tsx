import { Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TOPBAR_COPY } from '@/i18n/fr';
import { formatDateTime } from '@/utils';
import {
  formatRelativeTime,
  getNotificationVisual,
  isUnread,
} from '@/components/notifications/notificationUtils';
import type { AppNotification } from '@/types';

interface NotificationDetailModalProps {
  notification: AppNotification | null;
  open: boolean;
  onClose: () => void;
  onMarkRead?: (id: string) => void;
  markingId?: string | null;
}

export default function NotificationDetailModal({
  notification,
  open,
  onClose,
  onMarkRead,
  markingId = null,
}: NotificationDetailModalProps) {
  const isOpen = open && notification !== null;
  const unread = notification ? isUnread(notification) : false;
  const visual = notification ? getNotificationVisual(notification.type) : null;
  const Icon = visual?.icon;
  const isMarking = notification ? markingId === notification.id : false;
  const copy = TOPBAR_COPY.notifications.detail;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={notification?.title ?? ''}
      size="xl"
      overlayClassName="z-[200]"
    >
      {notification && visual && Icon ? (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${visual.bgClass}`}
            >
              <Icon className={`h-7 w-7 ${visual.iconClass}`} aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--color-surface-secondary)] px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {visual.label}
                </span>
                {unread ? (
                  <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                    {copy.unread}
                  </span>
                ) : null}
              </div>
              <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
                {notification.message}
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--color-surface-secondary)]/50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {copy.receivedAt}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--text)]">
                {formatDateTime(notification.created_at)}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                {formatRelativeTime(notification.created_at)}
              </p>
            </div>
            {notification.read_at ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {copy.readAt}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">
                  {formatDateTime(notification.read_at)}
                </p>
              </div>
            ) : null}
          </div>

          {notification.data && Object.keys(notification.data).length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {copy.details}
              </p>
              <dl className="space-y-2 rounded-xl border border-[var(--border)] p-4">
                {Object.entries(notification.data).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                    <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)] sm:w-32">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    <dd className="break-words text-sm text-[var(--text)]">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
            <Button layout="horizontal" variant="secondary" onClick={onClose}>
              {copy.close}
            </Button>
            {unread && onMarkRead ? (
              <Button
                layout="horizontal"
                loading={isMarking}
                onClick={() => onMarkRead(notification.id)}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {TOPBAR_COPY.notifications.markOneRead}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
