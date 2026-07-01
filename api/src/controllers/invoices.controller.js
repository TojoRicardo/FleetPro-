import { body, param, query } from 'express-validator';
import * as invoiceService from '../services/invoice.service.js';
import { ok } from '../utils/response.js';

export async function list(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const data = await invoiceService.listInvoices(req.user.companyId, {
      status: req.query.status,
      page,
      limit,
    });
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const data = await invoiceService.getInvoiceById(
      req.user.companyId,
      Number(req.params.id),
    );
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

export const listValidation = [
  query('status').optional().isIn(['pending', 'paid', 'overdue']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const getByIdValidation = [param('id').isInt({ min: 1 })];
