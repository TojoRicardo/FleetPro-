import { cn } from '@/utils';
import { PRICING_COPY } from '@/pricing/copy';
import type { BillingCycle } from '@/pricing/plans.js';

interface BillingCycleToggleProps {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  compact?: boolean;
}

export default function BillingCycleToggle({ value, onChange, compact = false }: BillingCycleToggleProps) {
  const copy = PRICING_COPY.billingCycle;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--color-surface-secondary)]',
        compact ? 'p-0.5' : 'p-1',
      )}
      role="group"
      aria-label={copy.monthly}
    >
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'rounded-full font-medium transition-all duration-200',
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-4 py-2 text-sm',
          value === 'monthly'
            ? 'bg-[var(--card)] text-[var(--text)] shadow-sm'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--text)]',
        )}
      >
        {copy.monthly}
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={cn(
          'rounded-full font-medium transition-all duration-200',
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-4 py-2 text-sm',
          value === 'yearly'
            ? 'bg-[var(--card)] text-[var(--text)] shadow-sm'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--text)]',
        )}
      >
        {copy.yearly}{' '}
        <span className={cn('text-emerald-600 dark:text-emerald-400', compact && 'text-[10px]')}>
          {copy.yearlyBadge}
        </span>
      </button>
    </div>
  );
}
