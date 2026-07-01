import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRICING_PLANS = [
  {
    name: 'Starter',
    slug: 'starter',
    priceMonthly: 19,
    priceYearly: 182.4,
    pricePerVehicle: 0,
    maxVehicles: 10,
  },
  {
    name: 'Business',
    slug: 'business',
    priceMonthly: 49,
    priceYearly: 470.4,
    pricePerVehicle: 1.5,
    maxVehicles: 50,
  },
  {
    name: 'Pro',
    slug: 'pro',
    priceMonthly: 149,
    priceYearly: 1430.4,
    pricePerVehicle: 1.2,
    maxVehicles: 200,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    priceMonthly: 399,
    priceYearly: 3830.4,
    pricePerVehicle: 0.8,
    maxVehicles: 10000,
  },
];

async function main() {
  for (const plan of PRICING_PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: {
        name: plan.name,
        slug: plan.slug,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        pricePerVehicle: plan.pricePerVehicle,
        price: plan.priceMonthly,
        maxVehicles: plan.maxVehicles,
        isActive: true,
      },
      update: {
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        pricePerVehicle: plan.pricePerVehicle,
        price: plan.priceMonthly,
        maxVehicles: plan.maxVehicles,
        isActive: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
