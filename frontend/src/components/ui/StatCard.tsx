import { cn } from '@/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'primary' | 'green' | 'amber' | 'purple' | 'red' | 'blue';
  index?: number;
}

const gradients = {
  primary: 'from-indigo-500/12 via-indigo-500/5 to-transparent',
  green: 'from-emerald-500/12 via-emerald-500/5 to-transparent',
  amber: 'from-amber-500/12 via-amber-500/5 to-transparent',
  purple: 'from-purple-500/12 via-purple-500/5 to-transparent',
  red: 'from-red-500/12 via-red-500/5 to-transparent',
  blue: 'from-blue-500/12 via-blue-500/5 to-transparent',
};

const iconStyles = {
  primary: 'bg-primary-500/10 text-primary-600 ring-primary-500/20',
  green: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
  purple: 'bg-purple-500/10 text-purple-600 ring-purple-500/20',
  red: 'bg-red-500/10 text-red-600 ring-red-500/20',
  blue: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
};

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'primary', index = 0 }: StatCardProps) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-[var(--border)] p-5',
        'bg-[var(--card)] shadow-[var(--shadow-card)]',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]',
        'hover:border-[var(--primary)]/30'
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-80', gradients[color])} />
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-[var(--card)]/40 to-transparent blur-2xl" />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--text)]">
            {displayValue}
          </p>
          {trend && (
            <div className={cn(
              'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              trendUp === true && 'bg-emerald-500/10 text-emerald-600',
              trendUp === false && 'bg-red-500/10 text-red-500',
              trendUp === undefined && 'text-[var(--color-text-secondary)]'
            )}>
              {trendUp === true && <TrendingUp className="h-3 w-3" />}
              {trendUp === false && <TrendingDown className="h-3 w-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-all duration-300',
          'group-hover:scale-110 group-hover:shadow-lg',
          iconStyles[color]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
