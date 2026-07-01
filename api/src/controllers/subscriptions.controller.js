import { body } from 'express-validator';
import * as subscriptionService from '../services/subscription.service.js';
import { ok, created } from '../utils/response.js';

export async function list(req, res, next) {
  try {
    const data = await subscriptionService.listSubscriptions(req.user.companyId);
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const data = await subscriptionService.createSubscription(req.user.companyId, {
      plan_id: req.body.plan_id,
      billing_cycle: req.body.billing_cycle,
    });
    return created(res, data, 'Subscription created successfully.');
  } catch (error) {
    next(error);
  }
}

export async function createFromPricing(req, res, next) {
  try {
    const data = await subscriptionService.createFromPricing(req.user.companyId, {
      plan: req.body.plan,
      vehicles: req.body.vehicles,
      billing_cycle: req.body.billing_cycle,
    });
    return created(res, data, 'Subscription created successfully.');
  } catch (error) {
    next(error);
  }
}

export const createValidation = [
  body('plan_id').isInt({ min: 1 }).withMessage('plan_id is required.'),
  body('billing_cycle').optional().isIn(['monthly', 'yearly']),
];

export const createFromPricingValidation = [
  body('plan').isIn(['starter', 'business', 'pro', 'enterprise']).withMessage('plan is required.'),
  body('vehicles').isInt({ min: 1, max: 10000 }).withMessage('vehicles must be a positive integer.'),
  body('billing_cycle').optional().isIn(['monthly', 'yearly']),
];
