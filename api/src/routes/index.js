import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as invoicesController from '../controllers/invoices.controller.js';
import * as paymentsController from '../controllers/payments.controller.js';
import * as subscriptionsController from '../controllers/subscriptions.controller.js';
import * as plansController from '../controllers/plans.controller.js';

const router = Router();

router.get(
  '/invoices',
  authenticate,
  validate(invoicesController.listValidation),
  invoicesController.list,
);

router.get(
  '/invoices/:id',
  authenticate,
  validate(invoicesController.getByIdValidation),
  invoicesController.getById,
);

router.post(
  '/payments/pay',
  authenticate,
  validate(paymentsController.payValidation),
  paymentsController.pay,
);

router.get('/subscriptions', authenticate, subscriptionsController.list);

router.get('/plans', authenticate, plansController.list);

router.post(
  '/subscriptions',
  authenticate,
  validate(subscriptionsController.createValidation),
  subscriptionsController.create,
);

router.post(
  '/subscriptions/create',
  authenticate,
  validate(subscriptionsController.createFromPricingValidation),
  subscriptionsController.createFromPricing,
);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'FleetPro Billing API is running.' });
});

export default router;
