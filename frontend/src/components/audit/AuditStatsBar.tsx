import { Activity, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { AuditLogStats } from '@/types';
import { EMPTY_STATS } from '@/utils/auditLog';

interface AuditStatsBarProps {
  stats?: AuditLogStats;
  loading?: boolean;
}

const cards = [
  { key: 'today_total' as const, label: 'Activités aujourd\'hui', icon: Activity, color: 'text-primary-600 bg-primary-500/10' },
  { key: 'creates' as const, label: 'Créations', icon: Plus, color: 'text-emerald-600 bg-emerald-500/10' },
  { key: 'updates' as const, label: 'Modifications', icon: Pencil, color: 'text-amber-600 bg-amber-500/10' },
  { key: 'deletes' as const, label: 'Suppressions', icon: Trash2, color: 'text-red-600 bg-red-500/10' },
  { key: 'failures' as const, label: 'Échecs', icon: AlertTriangle, color: 'text-orange-600 bg-orange-500/10' },
];

export default function AuditStatsBar({ stats = EMPTY_STATS, loading }: AuditStatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4 shadow-sm backdrop-blur-sm transition-colors duration-300"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</p>
              <p className="text-2xl font-bold text-[var(--text)]">
                {loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-[var(--color-surface-secondary)]" /> : stats[key]}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
