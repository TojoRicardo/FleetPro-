import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

export function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new AppError('Validation failed.', 422, 'VALIDATION_ERROR', errors.array()),
      );
    }
    return next();
  };
}
