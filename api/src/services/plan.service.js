import prisma from '../config/database.js';
import { decimalToNumber } from '../utils/serializers.js';

export async function listPlans() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: 'asc' },
  });

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    price_monthly: decimalToNumber(plan.priceMonthly),
    price_yearly: decimalToNumber(plan.priceYearly),
    price_per_vehicle: decimalToNumber(plan.pricePerVehicle || plan.priceMonthly || plan.price),
    max_vehicles: plan.maxVehicles,
    is_active: plan.isActive,
  }));
}
