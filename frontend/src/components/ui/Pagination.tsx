import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import type { PaginatedMeta } from '@/types';
import { cn } from '@/utils';

interface PaginationProps {
  meta?: PaginatedMeta;
  page: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ meta, page, onPageChange }: PaginationProps) {
  if (!meta || meta.last_page <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(meta.last_page, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const from = meta ? (meta.current_page - 1) * meta.per_page + 1 : 0;
  const to = meta ? Math.min(meta.current_page * meta.per_page, meta.total) : 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-4">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-slate-700">{meta.total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" layout="horizontal" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200',
              p === page
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {p}
          </button>
        ))}
        <Button variant="outline" size="sm" layout="horizontal" disabled={page >= meta.last_page} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
