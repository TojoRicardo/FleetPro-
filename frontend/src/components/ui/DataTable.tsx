import { useState } from 'react';
import { Search, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '@/utils';
import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';
import { Inbox } from 'lucide-react';
import Button from './Button';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface Filter {
  key: string;
  type: 'search' | 'select';
  placeholder?: string;
  value?: string;
  options?: { value: string; label: string }[];
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  filters?: Filter[];
  onFilterChange?: (key: string, value: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  selectable?: boolean;
  onBulkDelete?: (ids: (number | string)[]) => void;
}

export default function DataTable<T extends { id: number | string }>({
  columns, data, loading, filters, onFilterChange,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyIcon: EmptyIcon = Inbox,
  selectable,
  onBulkDelete,
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Set<number | string>>(new Set());
  const rows = Array.isArray(data) ? data : [];

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const toggleRow = (id: number | string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const allCols = selectable
    ? [{ key: '_select', label: '', className: 'w-10' }, ...columns]
    : columns;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)] transition-colors duration-300">
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] p-4">
          {filters.map((f) =>
            f.type === 'search' ? (
              <div key={f.key} className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  type="text"
                  placeholder={f.placeholder ?? 'Search...'}
                  value={f.value ?? ''}
                  onChange={(e) => onFilterChange?.(f.key, e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-surface-secondary)] py-2.5 pl-10 pr-3 text-sm text-[var(--text)] transition-all duration-300 focus:border-primary-500 focus:bg-[var(--card)] focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                />
              </div>
            ) : (
              <div key={f.key} className="relative">
                <select
                  value={f.value ?? ''}
                  onChange={(e) => onFilterChange?.(f.key, e.target.value)}
                  className="input-field appearance-none py-2.5 pl-3.5 pr-9"
                >
                  <option value="">{f.placeholder ?? 'All'}</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
              </div>
            )
          )}
        </div>
      )}

      {selectable && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-[var(--color-accent-light)] bg-[var(--color-accent-muted)]/50 px-4 py-2.5">
          <span className="text-sm font-medium text-[var(--primary)]">{selected.size} selected</span>
          {onBulkDelete && (
            <Button variant="danger" size="sm" onClick={() => { onBulkDelete([...selected]); setSelected(new Set()); }}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span>Supprimer</span>
            </Button>
          )}
          <button type="button" onClick={() => setSelected(new Set())} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--text)]">Clear</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="table-header-row">
              {selectable && (
                <th className="w-10 px-4 py-3.5">
                  <input type="checkbox" checked={rows.length > 0 && selected.size === rows.length} onChange={toggleAll} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className={cn('px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]', col.className)}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={allCols.length}><TableSkeleton /></td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={allCols.length}>
                  <EmptyState
                    icon={EmptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    'group border-b border-[var(--border)] transition-all duration-150 last:border-0',
                    'hover:bg-[var(--color-table-hover)]',
                    i % 2 === 1 && 'bg-[var(--color-surface-secondary)]/50',
                    selected.has(row.id) && 'bg-[var(--color-accent-muted)]/50'
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3.5 text-[var(--color-text-table)]', col.className)}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
