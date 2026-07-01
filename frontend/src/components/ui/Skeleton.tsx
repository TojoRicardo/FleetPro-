import { cn } from '@/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('rounded-xl skeleton-shimmer', className)} />;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors duration-300">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-9 w-20 mb-3" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
