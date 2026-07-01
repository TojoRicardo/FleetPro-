import { body } from 'express-validator';
import * as paymentService from '../services/payment.service.js';
import { ok } from '../utils/response.js';

export async function pay(req, res, next) {
  try {
    const idempotencyKey =
      req.headers['idempotency-key'] ||
      req.headers['Idempotency-Key'] ||
      req.body.idempotency_key;

    const result = await paymentService.payInvoice({
      companyId: req.user.companyId,
      invoiceId: Number(req.body.invoiceId),
      method: req.body.method,
      amount: req.body.amount,
      idempotencyKey,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return ok(
      res,
      result,
      result.replayed ? 'Payment already processed (idempotent replay).' : 'Payment completed successfully.',
    );
  } catch (error) {
    next(error);
  }
}

export const payValidation = [
  body('invoiceId').isInt({ min: 1 }).withMessage('invoiceId is required.'),
  body('method')
    .isIn(['cash', 'mobile_money', 'card'])
    .withMessage('method must be cash, mobile_money, or card.'),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('idempotency_key').optional().isString().isLength({ max: 64 }),
];
