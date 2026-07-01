import {
  PLANS,
  YEARLY_DISCOUNT_PERCENT,
  type BillingCycle,
  type PlanSlug,
  type PricingPlan,
} from '@/pricing/plans.js';

export interface PriceBreakdown {
  baseAmount: number;
  vehicleAmount: number;
  vehicleCount: number;
  monthlyTotal: number;
  periodTotal: number;
  billingCycle: BillingCycle;
}

export function clampVehicleCount(count: number, min: number, max: number): number {
  return Math.min(Math.max(count, min), max);
}

export function isVehicleCountInPlanRange(plan: PricingPlan, vehicles: number): boolean {
  if (vehicles < plan.minVehicles) return false;
  if (plan.maxVehicles != null && vehicles > plan.maxVehicles) return false;
  return true;
}

export function resolvePlanForVehicleCount(vehicles: number): PricingPlan {
  const match = PLANS.find((plan) => isVehicleCountInPlanRange(plan, vehicles));
  return match ?? PLANS[PLANS.length - 1];
}

export function calculateMonthlyTotal(plan: PricingPlan, vehicles: number): number {
  const billableVehicles = Math.max(vehicles, 0);
  const baseAmount = plan.basePriceMonthly;
  const vehicleAmount = billableVehicles * plan.perVehiclePrice;
  return Math.round((baseAmount + vehicleAmount) * 100) / 100;
}

export function getDisplayBasePrice(plan: PricingPlan, billingCycle: BillingCycle): number {
  if (billingCycle === 'yearly') {
    return Math.round(plan.basePriceMonthly * (1 - YEARLY_DISCOUNT_PERCENT / 100) * 100) / 100;
  }
  return plan.basePriceMonthly;
}

export function applyBillingCycle(monthlyTotal: number, billingCycle: BillingCycle): number {
  if (billingCycle === 'yearly') {
    const yearlyBeforeDiscount = monthlyTotal * 12;
    const discount = yearlyBeforeDiscount * (YEARLY_DISCOUNT_PERCENT / 100);
    return Math.round((yearlyBeforeDiscount - discount) * 100) / 100;
  }
  return monthlyTotal;
}

export function calculatePriceBreakdown(
  plan: PricingPlan,
  vehicles: number,
  billingCycle: BillingCycle,
): PriceBreakdown {
  const vehicleCount = Math.max(vehicles, 0);
  const baseAmount = plan.basePriceMonthly;
  const vehicleAmount = Math.round(vehicleCount * plan.perVehiclePrice * 100) / 100;
  const monthlyTotal = Math.round((baseAmount + vehicleAmount) * 100) / 100;
  const periodTotal = applyBillingCycle(monthlyTotal, billingCycle);

  return {
    baseAmount,
    vehicleAmount,
    vehicleCount,
    monthlyTotal,
    periodTotal,
    billingCycle,
  };
}

export function getPlanExampleMonthlyTotal(plan: PricingPlan): number | null {
  if (plan.exampleVehicles == null) return null;
  return calculateMonthlyTotal(plan, plan.exampleVehicles);
}

export function formatPlanVehicleRange(plan: PricingPlan): string {
  return plan.vehicleRange;
}

export function getPlanById(planId: PlanSlug): PricingPlan | undefined {
  return PLANS.find((plan) => plan.id === planId);
}

/** Default fleet size when selecting a plan from the pricing cards. */
export function getDefaultVehicleCountForPlan(plan: PricingPlan): number {
  return plan.exampleVehicles ?? plan.maxVehicles ?? plan.minVehicles;
}

/** French SaaS price display: `49 $` (avoids Intl wrapping issues in narrow columns). */
export function formatFrenchUsd(amount: number): string {
  const formatted = Number.isInteger(amount)
    ? String(amount)
    : amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${formatted}\u00A0$`;
}
