import * as planService from '../services/plan.service.js';
import { ok } from '../utils/response.js';

export async function list(req, res, next) {
  try {
    const data = await planService.listPlans();
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}
