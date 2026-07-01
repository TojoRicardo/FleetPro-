import { cn } from '@/utils';
import { ACTION_LABELS, ACTION_COLORS, ROLE_LABELS } from '@/utils/auditLog';

export function AuditActionBadge({ action }: { action: string }) {
  const label = ACTION_LABELS[action] ?? action;
  const color = ACTION_COLORS[action] ?? 'bg-slate-500/15 text-slate-700 ring-slate-500/20';

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', color)}>
      {label}
    </span>
  );
}

export function AuditActionDetail({ action, role }: { action: string; role?: string }) {
  const actor = role ? ROLE_LABELS[role] ?? role : 'Utilisateur';

  return (
    <div>
      <AuditActionBadge action={action} />
      <p className="mt-1 text-xs text-slate-500">par {actor}</p>
    </div>
  );
}

export function AuditResultBadge({ result = 'success', durationMs }: { result?: string; durationMs?: number | null }) {
  const colors = {
    success: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/25',
    failed: 'bg-red-500/15 text-red-700 ring-red-500/25',
    partial: 'bg-amber-500/15 text-amber-700 ring-amber-500/25',
  }[result] ?? 'bg-slate-500/15 text-slate-600';

  const labels = { success: 'Succès', failed: 'Échec', partial: 'Partiel' } as Record<string, string>;

  return (
    <div>
      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', colors)}>
        {labels[result] ?? result}
      </span>
      {durationMs != null && (
        <p className="mt-1 text-xs text-slate-500">Temps : {durationMs} ms</p>
      )}
    </div>
  );
}
