export type PlanSlug = 'starter' | 'business' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';

export interface PricingPlan {
  id: PlanSlug;
  name: string;
  tagline: string;
  vehicleRangeLabel: string;
  vehicleRange: string;
  basePriceMonthly: number;
  perVehiclePrice: number;
  minVehicles: number;
  maxVehicles: number | null;
  priceDescription: string;
  marketingText: string;
  exampleVehicles: number | null;
  startingAt: boolean;
  popular: boolean;
  features: string[];
  ctaLabel: string;
}

export const YEARLY_DISCOUNT_PERCENT: number;
export const CALCULATOR_MIN_VEHICLES: number;
export const CALCULATOR_MAX_VEHICLES: number;
export const DEFAULT_BILLING_CYCLE: BillingCycle;
export const DEFAULT_VEHICLE_COUNT: number;
export const PLANS: PricingPlan[];
export const PLANS_BY_ID: Record<PlanSlug, PricingPlan>;
