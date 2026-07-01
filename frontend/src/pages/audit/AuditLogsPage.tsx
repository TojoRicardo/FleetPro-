import { useMemo, useState } from 'react';
import Drawer from '@/components/ui/Drawer';
import Avatar from '@/components/ui/Avatar';
import AuditStatsBar from '@/components/audit/AuditStatsBar';
import AuditFilters, { emptyAuditFilters, type AuditFiltersState } from '@/components/audit/AuditFilters';
import AuditLogTable from '@/components/audit/AuditLogTable';
import { AuditDiffPanel } from '@/components/audit/AuditChangesPreview';
import { useInfiniteAuditLogs, useAuditLogStats, useExportAuditLogs } from '@/hooks/useQueries';
import { usePollingFallback, useRealtime } from '@/hooks/useRealtime';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToastStore } from '@/store';
import type { AuditLog } from '@/types';
import {
  dedupeAuditLogs,
  exportAuditLogsCsv,
  exportAuditLogsExcel,
  exportAuditLogsPdf,
  ROLE_LABELS,
} from '@/utils/auditLog';
import { formatDateTime } from '@/utils';

const PER_PAGE = 20;

export default function AuditLogsPage() {
  useRealtime();
  usePollingFallback(['audit-logs'], 60000);

  const [filters, setFilters] = useState<AuditFiltersState>(emptyAuditFilters);
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const [selectedUserLog, setSelectedUserLog] = useState<AuditLog | null>(null);
  const [selectedDiffLog, setSelectedDiffLog] = useState<AuditLog | null>(null);
  const toast = useToastStore((s) => s.addToast);

  const queryParams = useMemo(() => ({
    per_page: PER_PAGE,
    search: debouncedSearch,
    user_id: filters.user_id || undefined,
    action: filters.action || undefined,
    entity_type: filters.entity_type || undefined,
    result: filters.result || undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
    session: filters.session || undefined,
    sort: filters.sort,
  }), [debouncedSearch, filters]);

  const { data: stats, isLoading: statsLoading } = useAuditLogStats();
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteAuditLogs(queryParams);

  const exportMutation = useExportAuditLogs();

  const logs = useMemo(
    () => dedupeAuditLogs(data?.pages.flatMap((p) => p.data) ?? []),
    [data],
  );

  const users = useMemo(() => {
    const map = new Map<number, { id: number; name: string; email: string }>();
    logs.forEach((log) => {
      if (log.user) map.set(log.user.id, { id: log.user.id, name: log.user.name, email: log.user.email });
    });
    return [...map.values()];
  }, [logs]);

  const handleFilterChange = (patch: Partial<AuditFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const exported = await exportMutation.mutateAsync(queryParams);
      if (format === 'csv') exportAuditLogsCsv(exported);
      else if (format === 'excel') exportAuditLogsExcel(exported);
      else exportAuditLogsPdf(exported);
      toast('success', `Export ${format.toUpperCase()} prêt.`);
    } catch {
      toast('error', 'Export échoué.');
    }
  };

  return (
    <>
      <div className="w-full space-y-6 p-4 sm:p-6">
        <AuditStatsBar stats={stats} loading={statsLoading} />

        <AuditFilters
          filters={filters}
          users={users}
          onChange={handleFilterChange}
          onExport={handleExport}
          exporting={exportMutation.isPending}
        />

        <AuditLogTable
          logs={logs}
          loading={isLoading}
          loadingMore={isFetchingNextPage}
          hasMore={!!hasNextPage}
          onLoadMore={() => fetchNextPage()}
          onUserClick={setSelectedUserLog}
          onChangesClick={setSelectedDiffLog}
        />
      </div>

      <Drawer
        open={!!selectedUserLog}
        onClose={() => setSelectedUserLog(null)}
        title="Profil utilisateur"
        subtitle={selectedUserLog?.user?.email}
      >
        {selectedUserLog?.user ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={selectedUserLog.user.name} size="lg" />
              <div>
                <p className="text-lg font-semibold text-slate-900">{selectedUserLog.user.name}</p>
                <p className="text-sm text-primary-600">{selectedUserLog.user.email}</p>
              </div>
            </div>
            <dl className="grid gap-4 rounded-xl border border-slate-200 p-4">
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Rôle</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {ROLE_LABELS[selectedUserLog.user.role] ?? selectedUserLog.user.role}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Département</dt>
                <dd className="mt-1 text-sm text-slate-900">Flotte & Opérations</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Dernière activité</dt>
                <dd className="mt-1 text-sm text-slate-900">{formatDateTime(selectedUserLog.created_at)}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Action système — aucun profil associé.</p>
        )}
      </Drawer>

      <Drawer
        open={!!selectedDiffLog}
        onClose={() => setSelectedDiffLog(null)}
        title="Détails des changements"
        subtitle={selectedDiffLog ? `${selectedDiffLog.resource_label} ${selectedDiffLog.resource_reference ?? ''}`.trim() : undefined}
        width="lg"
      >
        {selectedDiffLog && <AuditDiffPanel log={selectedDiffLog} />}
      </Drawer>
    </>
  );
}
