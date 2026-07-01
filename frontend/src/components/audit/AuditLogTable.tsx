import { useEffect, useRef, useCallback } from 'react';
import Avatar from '@/components/ui/Avatar';
import { AuditActionDetail, AuditResultBadge } from '@/components/audit/AuditBadges';
import AuditChangesPreview from '@/components/audit/AuditChangesPreview';
import type { AuditLog } from '@/types';
import {
  formatAuditDate,
  formatRelativeTime,
  estimateSessionDuration,
} from '@/utils/auditLog';

interface AuditLogTableProps {
  logs: AuditLog[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onUserClick: (log: AuditLog) => void;
  onChangesClick: (log: AuditLog) => void;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100">
          {Array.from({ length: 7 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-4 animate-pulse rounded bg-slate-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AuditLogTable({
  logs,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onUserClick,
  onChangesClick,
}: AuditLogTableProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !loadingMore && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loadingMore, onLoadMore],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border-table)] bg-[var(--card)] shadow-[var(--shadow-card)] transition-colors duration-300">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="table-header-row">
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Utilisateur</th>
              <th className="px-4 py-3.5">Action</th>
              <th className="px-4 py-3.5">Ressource</th>
              <th className="px-4 py-3.5">Résultat</th>
              <th className="px-4 py-3.5">Changements</th>
              <th className="px-4 py-3.5">Session</th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              <SkeletonRows />
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                  Aucune activité ne correspond à vos filtres.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const { date, time } = formatAuditDate(log.created_at);
                return (
                  <tr
                    key={log.id}
                    className="table-row"
                  >
                    <td className="px-4 py-4 align-top">
                      <p className="font-medium text-slate-900">{date}</p>
                      <p className="text-slate-600">{time}</p>
                      <p className="mt-1 text-xs text-slate-400">({formatRelativeTime(log.created_at)})</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => onUserClick(log)}
                        className="flex items-start gap-3 text-left transition-opacity hover:opacity-80"
                      >
                        <Avatar name={log.user?.name ?? 'Système'} size="md" />
                        <div>
                          <p className="font-semibold text-slate-900">{log.user?.name ?? 'Système'}</p>
                          <p className="text-xs text-primary-600">{log.user?.email ?? '—'}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <AuditActionDetail action={log.action} role={log.user?.role} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-medium text-slate-900">{log.resource_label ?? log.entity_type}</p>
                      {log.resource_reference && (
                        <p className="text-xs text-slate-500">
                          {log.entity_type === 'user' && log.resource_reference.includes('@') ? (
                            <a href={`mailto:${log.resource_reference}`} className="text-primary-500 hover:underline">
                              {log.resource_reference}
                            </a>
                          ) : (
                            log.resource_reference
                          )}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <AuditResultBadge result={log.result} durationMs={log.duration_ms} />
                    </td>
                    <td className="px-4 py-4 align-top max-w-[220px]">
                      <AuditChangesPreview log={log} onViewDetails={() => onChangesClick(log)} />
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-600">
                      <p><span className="text-slate-400">Session :</span> {log.session_id ?? '—'}</p>
                      <p className="mt-1"><span className="text-slate-400">Durée :</span> {estimateSessionDuration(log)}</p>
                      <p className="mt-1"><span className="text-slate-400">Appareil :</span> {log.device_type ?? 'Desktop'}</p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div ref={sentinelRef} className="flex justify-center border-t border-slate-100 px-4 py-3">
        {loadingMore && <p className="text-sm text-slate-500">Chargement...</p>}
        {!loadingMore && !hasMore && logs.length > 0 && (
          <p className="text-xs text-slate-400">Fin de l'historique</p>
        )}
      </div>
    </div>
  );
}
