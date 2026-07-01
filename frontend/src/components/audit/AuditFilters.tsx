import { Search, SlidersHorizontal, ArrowUpDown, FileSpreadsheet, FileText, FileDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ACTION_LABELS, RESULT_LABELS } from '@/utils/auditLog';

export type AuditFiltersState = {
  search: string;
  user_id: string;
  action: string;
  entity_type: string;
  result: string;
  date_from: string;
  date_to: string;
  session: string;
  sort: 'desc' | 'asc';
};

export const emptyAuditFilters: AuditFiltersState = {
  search: '',
  user_id: '',
  action: '',
  entity_type: '',
  result: '',
  date_from: '',
  date_to: '',
  session: '',
  sort: 'desc',
};

interface AuditFiltersProps {
  filters: AuditFiltersState;
  users: Array<{ id: number; name: string; email: string }>;
  onChange: (patch: Partial<AuditFiltersState>) => void;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
  exporting?: boolean;
}

export default function AuditFilters({ filters, users, onChange, onExport, exporting }: AuditFiltersProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4 shadow-sm backdrop-blur-sm transition-colors duration-300">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <input
            type="search"
            placeholder="Rechercher par nom ou e-mail..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-surface-secondary)] py-2.5 pl-10 pr-3 text-sm text-[var(--text)] transition-all duration-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onChange({ sort: filters.sort === 'desc' ? 'asc' : 'desc' })}>
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
            <span>{filters.sort === 'desc' ? 'Plus récent' : 'Plus ancien'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport('csv')} loading={exporting}>
            <FileDown className="h-4 w-4" aria-hidden="true" />
            <span>CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport('excel')} loading={exporting}>
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>Excel</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport('pdf')} loading={exporting}>
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>PDF</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
        <SlidersHorizontal className="h-4 w-4" /> Filtres avancés
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <select value={filters.user_id} onChange={(e) => onChange({ user_id: e.target.value })} className="input-field py-2.5">
          <option value="">Utilisateur</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={filters.action} onChange={(e) => onChange({ action: e.target.value })} className="input-field py-2.5">
          <option value="">Action</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.entity_type} onChange={(e) => onChange({ entity_type: e.target.value })} className="input-field py-2.5">
          <option value="">Ressource</option>
          <option value="vehicle">Véhicule</option>
          <option value="driver">Conducteur</option>
          <option value="trip">Trajet</option>
          <option value="maintenance">Maintenance</option>
          <option value="user">Utilisateur</option>
          <option value="document">Document</option>
          <option value="report">Rapport</option>
        </select>
        <select value={filters.result} onChange={(e) => onChange({ result: e.target.value })} className="input-field py-2.5">
          <option value="">Résultat</option>
          {Object.entries(RESULT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => onChange({ date_from: e.target.value })} className="input-field py-2.5" aria-label="Date début" />
        <input type="text" value={filters.session} onChange={(e) => onChange({ session: e.target.value })} placeholder="Session (ex: S-93A2)" className="input-field py-2.5" />
      </div>
    </div>
  );
}
