import {
  Bell,
  Car,
  CreditCard,
  Link2,
  Route,
  Shield,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { TOPBAR_COPY } from '@/i18n/fr';
import { formatDateTime } from '@/utils';
import type { AppNotification } from '@/types';

export interface NotificationVisual {
  icon: LucideIcon;
  label: string;
  iconClass: string;
  bgClass: string;
}

export function getNotificationVisual(type: string): NotificationVisual {
  const copy = TOPBAR_COPY.notifications.types;

  if (type.startsWith('vehicle')) {
    return { icon: Car, label: copy.vehicle, iconClass: 'text-blue-600', bgClass: 'bg-blue-100 dark:bg-blue-500/15' };
  }
  if (type.startsWith('trip')) {
    return { icon: Route, label: copy.trip, iconClass: 'text-indigo-600', bgClass: 'bg-indigo-100 dark:bg-indigo-500/15' };
  }
  if (type.startsWith('assignment')) {
    return { icon: Link2, label: copy.assignment, iconClass: 'text-violet-600', bgClass: 'bg-violet-100 dark:bg-violet-500/15' };
  }
  if (type.startsWith('maintenance')) {
    return { icon: Wrench, label: copy.maintenance, iconClass: 'text-amber-600', bgClass: 'bg-amber-100 dark:bg-amber-500/15' };
  }
  if (type.startsWith('billing') || type.startsWith('payment') || type.startsWith('invoice')) {
    return { icon: CreditCard, label: copy.billing, iconClass: 'text-emerald-600', bgClass: 'bg-emerald-100 dark:bg-emerald-500/15' };
  }
  if (type.startsWith('security') || type.startsWith('login')) {
    return { icon: Shield, label: copy.security, iconClass: 'text-red-600', bgClass: 'bg-red-100 dark:bg-red-500/15' };
  }

  return { icon: Bell, label: copy.default, iconClass: 'text-primary-600', bgClass: 'bg-primary-100 dark:bg-primary-500/15' };
}

export function formatNotificationDayLabel(date: string): string {
  const value = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();

  if (sameDay(value, today)) return TOPBAR_COPY.notifications.today;
  if (sameDay(value, yesterday)) return TOPBAR_COPY.notifications.yesterday;

  return value.toLocaleDateString('fr-FR', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: string): string {
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const copy = TOPBAR_COPY.notifications.relative;

  if (diffSec < 60) return copy.justNow;
  if (diffSec < 3600) return copy.minutes(Math.floor(diffSec / 60));
  if (diffSec < 86400) return copy.hours(Math.floor(diffSec / 3600));

  return formatDateTime(date);
}

export function groupNotificationsByDay<T extends { created_at: string }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const day = formatNotificationDayLabel(item.created_at);
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});
}

export function isUnread(notification: Pick<AppNotification, 'read_at'>): boolean {
  return notification.read_at == null;
}
