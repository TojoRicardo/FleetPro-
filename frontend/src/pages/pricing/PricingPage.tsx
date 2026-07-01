import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PricingCard from '@/components/pricing/PricingCard';
import { ROUTES } from '@/routes/constants';
import PricingCalculator from '@/components/pricing/PricingCalculator';
import { createPricingSubscription } from '@/api/billing/pricingService';
import { getBillingErrorMessage, getSubscriptions } from '@/api/billing';
import { PRICING_COPY } from '@/pricing/copy';
import {
  CALCULATOR_MAX_VEHICLES,
  CALCULATOR_MIN_VEHICLES,
  DEFAULT_BILLING_CYCLE,
  DEFAULT_VEHICLE_COUNT,
  PLANS,
  type BillingCycle,
  type PlanSlug,
} from '@/pricing/plans.js';
import {
  getDefaultVehicleCountForPlan,
  isVehicleCountInPlanRange,
  resolvePlanForVehicleCount,
} from '@/pricing/calculatePrice';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/store';

export default function PricingPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const errorRef = useRef<HTMLDivElement>(null);
  const canManage = hasRole('admin');

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(DEFAULT_BILLING_CYCLE);
  const [vehicleCount, setVehicleCount] = useState(DEFAULT_VEHICLE_COUNT);
  const [loadingPlanId, setLoadingPlanId] = useState<PlanSlug | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPlanSlug, setCurrentPlanSlug] = useState<PlanSlug | null>(null);

  const copy = PRICING_COPY.page;

  useEffect(() => {
    let cancelled = false;

    getSubscriptions()
      .then((data) => {
        if (cancelled) return;
        const slug = data.active?.plan?.slug as PlanSlug | undefined;
        if (slug && PLANS.some((plan) => plan.id === slug)) {
          setCurrentPlanSlug(slug);
        }
      })
      .catch(() => {
        /* subscription state is optional on pricing page */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const recommendedPlanId = useMemo(
    () => resolvePlanForVehicleCount(vehicleCount).id,
    [vehicleCount],
  );

  const handleSelectPlan = useCallback(
    async (planId: PlanSlug) => {
      if (!canManage) {
        setError(PRICING_COPY.card.adminOnly);
        return;
      }

      const plan = PLANS.find((item) => item.id === planId);
      if (!plan) return;

      if (planId === currentPlanSlug) {
        addToast('info', 'Ce forfait est déjà actif sur votre compte.');
        return;
      }

      const fleetSize = isVehicleCountInPlanRange(plan, vehicleCount)
        ? vehicleCount
        : getDefaultVehicleCountForPlan(plan);

      if (fleetSize !== vehicleCount) {
        setVehicleCount(fleetSize);
      }

      setLoadingPlanId(planId);
      setError(null);

      try {
        const result = await createPricingSubscription({
          plan: planId,
          vehicles: fleetSize,
          billing_cycle: billingCycle,
        });

        navigate(ROUTES.BILLING, {
          replace: false,
          state: {
            subscriptionMessage: PRICING_COPY.checkout.successRedirect,
            pendingInvoice: result.pending_invoice,
            openPayment: result.requires_payment,
          },
        });
        addToast('success', PRICING_COPY.checkout.successRedirect);
      } catch (err) {
        const message = getBillingErrorMessage(err, PRICING_COPY.checkout.errorFallback);
        setError(message);
        addToast('error', message);
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } finally {
        setLoadingPlanId(null);
      }
    },
    [billingCycle, canManage, currentPlanSlug, navigate, vehicleCount, addToast],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
          {copy.title}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-[var(--color-text-secondary)]">
          {copy.subtitle}
        </p>
      </header>

      {error ? (
        <div
          ref={errorRef}
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {error}
        </div>
      ) : !canManage ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          {PRICING_COPY.card.adminOnly}
        </div>
      ) : null}

      <PricingCalculator
        vehicleCount={vehicleCount}
        billingCycle={billingCycle}
        onVehicleCountChange={setVehicleCount}
        onBillingCycleChange={setBillingCycle}
        minVehicles={CALCULATOR_MIN_VEHICLES}
        maxVehicles={CALCULATOR_MAX_VEHICLES}
      />

      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            onSelect={handleSelectPlan}
            loading={loadingPlanId === plan.id}
            disabled={!canManage || loadingPlanId != null}
            isCurrent={currentPlanSlug === plan.id}
            highlighted={recommendedPlanId === plan.id}
          />
        ))}
      </div>
    </div>
  );
}
