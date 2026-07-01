/** @typedef {'starter' | 'business' | 'pro' | 'enterprise'} PlanSlug */

/** @typedef {'monthly' | 'yearly'} BillingCycle */

/**
 * @typedef {Object} PricingPlan
 * @property {PlanSlug} id
 * @property {string} name
 * @property {string} tagline
 * @property {string} vehicleRangeLabel
 * @property {string} vehicleRange
 * @property {number} basePriceMonthly
 * @property {number} perVehiclePrice
 * @property {number} minVehicles
 * @property {number | null} maxVehicles
 * @property {string} priceDescription
 * @property {string} marketingText
 * @property {number | null} exampleVehicles
 * @property {boolean} startingAt
 * @property {boolean} popular
 * @property {string[]} features
 * @property {string} ctaLabel
 */

/** @type {number} */
export const YEARLY_DISCOUNT_PERCENT = 20;

/** @type {number} */
export const CALCULATOR_MIN_VEHICLES = 1;

/** @type {number} */
export const CALCULATOR_MAX_VEHICLES = 500;

/** @type {BillingCycle} */
export const DEFAULT_BILLING_CYCLE = 'monthly';

/** @type {number} */
export const DEFAULT_VEHICLE_COUNT = 20;

/** @type {PricingPlan[]} */
export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Pour les petites flottes qui démarrent efficacement',
    vehicleRangeLabel: '1 à 10 véhicules',
    vehicleRange: '1–10',
    basePriceMonthly: 19,
    perVehiclePrice: 0,
    minVehicles: 1,
    maxVehicles: 10,
    priceDescription: 'Tarif mensuel fixe par entreprise',
    marketingText:
      'Centralisez la gestion de votre flotte avec les fonctionnalités essentielles pour suivre vos véhicules et optimiser vos opérations quotidiennes.',
    exampleVehicles: null,
    startingAt: false,
    popular: false,
    features: [
      'Jusqu’à 10 véhicules',
      'Tableau de bord de gestion de flotte',
      'Suivi et performance des véhicules',
      'Gestion des conducteurs',
      'Assistance par e-mail',
      'Facturation mensuelle automatisée',
    ],
    ctaLabel: 'Commencer avec Starter',
  },
  {
    id: 'business',
    name: 'Business Standard (49$)',
    tagline: 'Pour les entreprises en croissance',
    vehicleRangeLabel: '11 à 50 véhicules',
    vehicleRange: '11–50',
    basePriceMonthly: 49,
    perVehiclePrice: 1.5,
    minVehicles: 11,
    maxVehicles: 50,
    priceDescription: '+1,50 $ par véhicule',
    marketingText:
      'Accélérez vos opérations grâce à des analyses avancées, une meilleure visibilité et des outils de gestion évolutifs.',
    exampleVehicles: 20,
    startingAt: false,
    popular: true,
    features: [
      'Jusqu’à 50 véhicules',
      'Toutes les fonctionnalités Starter',
      'Analyses avancées',
      'Planification de la maintenance',
      'Support prioritaire',
      'Accès API',
    ],
    ctaLabel: 'Choisir Business',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Pour les organisations à forte croissance',
    vehicleRangeLabel: '51 à 200 véhicules',
    vehicleRange: '51–200',
    basePriceMonthly: 149,
    perVehiclePrice: 1.2,
    minVehicles: 51,
    maxVehicles: 200,
    priceDescription: '+1,20 $ par véhicule',
    marketingText:
      'Développez votre activité avec des outils avancés de pilotage, de conformité et de reporting.',
    exampleVehicles: 100,
    startingAt: false,
    popular: false,
    features: [
      'Jusqu’à 200 véhicules',
      'Toutes les fonctionnalités Business',
      'Rapports personnalisés',
      'Journaux d’audit et conformité',
      'Gestionnaire de compte dédié',
      'Disponibilité SLA 99,9 %',
    ],
    ctaLabel: 'Passer au plan Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Premium (399$)',
    tagline: 'Solution complète pour grandes entreprises',
    vehicleRangeLabel: 'Plus de 200 véhicules',
    vehicleRange: '200+',
    basePriceMonthly: 399,
    perVehiclePrice: 0.8,
    minVehicles: 201,
    maxVehicles: null,
    priceDescription: '+0,80 $ par véhicule',
    marketingText:
      'Bénéficiez d’une plateforme hautement évolutive avec sécurité avancée et accompagnement dédié.',
    exampleVehicles: 300,
    startingAt: true,
    popular: false,
    features: [
      'Plus de 200 véhicules',
      'Toutes les fonctionnalités Pro',
      'Authentification unique (SSO)',
      'Sécurité avancée',
      'Intégrations personnalisées',
      'Accompagnement au déploiement',
      'Assistance prioritaire 24h/24 – 7j/7',
    ],
    ctaLabel: 'Contacter l’équipe commerciale',
  },
];

/** @type {Record<PlanSlug, PricingPlan>} */
export const PLANS_BY_ID = Object.fromEntries(PLANS.map((plan) => [plan.id, plan]));
