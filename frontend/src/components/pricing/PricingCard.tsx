import { Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { cn } from '@/utils';
import { PRICING_COPY } from '@/pricing/copy';
import {
  getDisplayBasePrice,
  getPlanExampleMonthlyTotal,
  formatFrenchUsd,
} from '@/pricing/calculatePrice';
import type { BillingCycle, PricingPlan } from '@/pricing/plans.js';

interface PricingCardProps {
  plan: PricingPlan;
  billingCycle: BillingCycle;
  onSelect: (planId: PricingPlan['id']) => void;
  loading?: boolean;
  disabled?: boolean;
  isCurrent?: boolean;
  highlighted?: boolean;
}

export default function PricingCard({
  plan,
  billingCycle,
  onSelect,
  loading = false,
  disabled = false,
  isCurrent = false,
  highlighted = false,
}: PricingCardProps) {
  const copy = PRICING_COPY.card;
  const displayBase = getDisplayBasePrice(plan, billingCycle);
  const exampleTotal = getPlanExampleMonthlyTotal(plan);

  return (
    <article
      className={cn(
        'group relative flex h-full min-h-[680px] flex-col rounded-2xl border bg-[var(--card)] p-6 sm:p-7 transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-[var(--shadow-modal)]',
        plan.popular && 'border-primary-500/60 shadow-[0_0_0_1px_rgba(37,99,235,0.15)] pt-8',
        highlighted && !plan.popular && 'border-primary-400/40',
        isCurrent && 'ring-2 ring-primary-500/30',
        !plan.popular && !highlighted && 'border-[var(--border)]',
      )}
    >
      {plan.popular ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="active" className="px-3 py-1 text-[11px] font-semibold shadow-sm">
            {copy.mostPopular}
          </Badge>
        </div>
      ) : null}

      <header className="mb-6 space-y-2">
        <h3 className="notranslate text-xl font-semibold tracking-tight text-[var(--text)]" translate="no">
          {plan.name}
        </h3>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{plan.tagline}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-primary-600/90 dark:text-primary-400">
          {plan.vehicleRangeLabel}
        </p>
      </header>

      <div className="mb-6 space-y-2 border-b border-[var(--border)] pb-6">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          {plan.startingAt ? (
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">{copy.startingAt}</span>
          ) : null}
          <span className="text-4xl font-bold tracking-tight text-[var(--text)]">
            {formatFrenchUsd(displayBase)}
          </span>
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">{copy.perMonth}</span>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">{plan.priceDescription}</p>
        {exampleTotal != null && plan.exampleVehicles != null ? (
          <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {copy.examplePrefix} {plan.exampleVehicles} véhicules → {formatFrenchUsd(exampleTotal)}
            {copy.perMonth}
          </p>
        ) : null}
      </div>

      <p className="mb-6 min-h-[4.5rem] text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {plan.marketingText}
      </p>

      <ul className="mb-8 flex flex-1 flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm leading-snug text-[var(--color-text-secondary)]">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
            <span className="flex-1">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2">
        {isCurrent ? (
          <Button variant="secondary" layout="horizontal" className="w-full" disabled>
            {copy.currentPlan}
          </Button>
        ) : (
          <Button
            className="w-full"
            layout="horizontal"
            variant={plan.popular ? 'primary' : 'outline'}
            loading={loading}
            disabled={disabled}
            title={disabled ? copy.adminOnly : undefined}
            onClick={() => onSelect(plan.id)}
          >
            {plan.ctaLabel}
          </Button>
        )}
      </div>
    </article>
  );
}
