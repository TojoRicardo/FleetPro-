import type { ReactNode } from 'react';
import { Calculator } from 'lucide-react';
import { cn } from '@/utils';
import BillingCycleToggle from '@/components/pricing/BillingCycleToggle';
import { PRICING_COPY } from '@/pricing/copy';
import {
  calculatePriceBreakdown,
  formatFrenchUsd,
  resolvePlanForVehicleCount,
} from '@/pricing/calculatePrice';
import type { BillingCycle } from '@/pricing/plans.js';

interface PricingCalculatorProps {
  vehicleCount: number;
  billingCycle: BillingCycle;
  onVehicleCountChange: (count: number) => void;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  minVehicles: number;
  maxVehicles: number;
}

const PRESETS = [10, 20, 50, 100, 300] as const;

function BreakdownRow({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <dt className="min-w-0 truncate text-[var(--color-text-secondary)]">{label}</dt>
      <dd className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-[var(--text)]">
        {value}
      </dd>
    </div>
  );
}

export default function PricingCalculator({
  vehicleCount,
  billingCycle,
  onVehicleCountChange,
  onBillingCycleChange,
  minVehicles,
  maxVehicles,
}: PricingCalculatorProps) {
  const copy = PRICING_COPY.calculator;
  const recommendedPlan = resolvePlanForVehicleCount(vehicleCount);
  const breakdown = calculatePriceBreakdown(recommendedPlan, vehicleCount, billingCycle);
  const periodSuffix = billingCycle === 'yearly' ? copy.perYear : copy.perMonth;
  const totalAmount =
    billingCycle === 'yearly' ? breakdown.periodTotal : breakdown.monthlyTotal;
  const sliderPercent =
    ((vehicleCount - minVehicles) / (maxVehicles - minVehicles)) * 100;
  const perVehicleLabel = recommendedPlan.perVehiclePrice.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleInputChange = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    onVehicleCountChange(Math.min(Math.max(parsed, minVehicles), maxVehicles));
  };

  return (
    <section className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
      {/* En-tête compact */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <Calculator className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">{copy.title}</h2>
            <p className="hidden text-[11px] text-[var(--color-text-secondary)] sm:block">
              {copy.subtitle}
            </p>
          </div>
        </div>
        <BillingCycleToggle value={billingCycle} onChange={onBillingCycleChange} compact />
      </div>

      <div className="grid sm:grid-cols-[1fr_auto]">
        {/* Contrôles */}
        <div className="space-y-3 border-b border-[var(--border)] px-4 py-4 sm:border-b-0 sm:border-r sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="vehicle-count" className="text-xs font-medium text-[var(--text)]">
              {copy.vehiclesLabel}
            </label>
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-surface-secondary)] px-2 py-1">
              <input
                id="vehicle-count"
                type="number"
                min={minVehicles}
                max={maxVehicles}
                value={vehicleCount}
                onChange={(event) => handleInputChange(event.target.value)}
                className="w-12 bg-transparent text-right text-lg font-bold tabular-nums text-[var(--text)] focus:outline-none"
              />
              <span className="text-[10px] text-[var(--color-text-secondary)]">{copy.vehiclesUnit}</span>
            </div>
          </div>

          <input
            type="range"
            min={minVehicles}
            max={maxVehicles}
            value={vehicleCount}
            onChange={(event) => onVehicleCountChange(Number(event.target.value))}
            style={{
              background: `linear-gradient(to right, rgb(37 99 235) ${sliderPercent}%, var(--color-surface-secondary) ${sliderPercent}%)`,
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary-600"
            aria-label={copy.vehiclesLabel}
            aria-valuemin={minVehicles}
            aria-valuemax={maxVehicles}
            aria-valuenow={vehicleCount}
          />

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onVehicleCountChange(preset)}
                className={cn(
                  'rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors',
                  vehicleCount === preset
                    ? 'border-primary-500 bg-primary-500/10 text-primary-700 dark:text-primary-300'
                    : 'border-[var(--border)] text-[var(--color-text-secondary)] hover:text-[var(--text)]',
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Résumé compact */}
        <div className="min-w-[220px] bg-[var(--color-surface-secondary)]/50 px-4 py-4 sm:px-5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            {copy.recommendedPlan}
          </p>
          <p className="notranslate mt-0.5 truncate text-sm font-bold text-[var(--text)]" translate="no">
            {recommendedPlan.name}
          </p>

          <p className="mt-2 text-xl font-bold tabular-nums text-primary-600 dark:text-primary-400">
            {formatFrenchUsd(totalAmount)}
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">{periodSuffix}</span>
          </p>

          <dl className="mt-3 space-y-1.5 border-t border-[var(--border)] pt-2.5">
            <BreakdownRow label={copy.breakdownBase} value={formatFrenchUsd(breakdown.baseAmount)} />
            {recommendedPlan.perVehiclePrice > 0 ? (
              <BreakdownRow
                label={`${copy.breakdownVehicles} (${breakdown.vehicleCount} × ${perVehicleLabel}\u00A0$)`}
                value={formatFrenchUsd(breakdown.vehicleAmount)}
              />
            ) : null}
            <BreakdownRow
              label={<span className="font-semibold text-[var(--text)]">{copy.breakdownTotal}</span>}
              value={`${formatFrenchUsd(totalAmount)}${periodSuffix}`}
            />
          </dl>
        </div>
      </div>
    </section>
  );
}
