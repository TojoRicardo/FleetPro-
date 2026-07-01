import { Car, Users, Route, Wrench, LogIn, Circle } from 'lucide-react';
import Card from './Card';
import { formatDateTime } from '@/utils';
import type { AuditLog } from '@/types';

const actionIcons: Record<string, typeof Car> = {
  vehicle: Car,
  driver: Users,
  trip: Route,
  maintenance: Wrench,
  user: Users,
  login: LogIn,
};

interface ActivityFeedProps {
  logs: AuditLog[];
  loading?: boolean;
}

export default function ActivityFeed({ logs, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card>
        <h3 className="text-base font-semibold text-slate-900 mb-4">Recent activity</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-9 w-9 rounded-xl skeleton-shimmer shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded skeleton-shimmer" />
                <div className="h-2 w-1/2 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <h3 className="text-base font-semibold text-slate-900 mb-2">Recent activity</h3>
        <p className="text-sm text-slate-500">No activity yet. Actions will appear here in real time.</p>
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Recent activity</h3>
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <Circle className="h-2 w-2 fill-current live-pulse" /> Live
          </span>
        </div>
      </div>
      <div className="max-h-[340px] overflow-y-auto">
        {logs.map((log) => {
          const entity = log.entity_type ?? log.entity ?? 'vehicle';
          const Icon = actionIcons[entity] ?? Circle;
          return (
            <div
              key={log.id}
              className="flex items-start gap-3 border-b border-[var(--border)] px-5 py-3.5 last:border-0"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <Icon className="h-4 w-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-900">
                  <span className="font-medium capitalize">{log.user?.name ?? 'System'}</span>
                  {' '}
                  <span className="text-slate-500">{log.action}</span>
                  {' '}
                  <span className="capitalize text-slate-600">{entity}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(log.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
