import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { AppError } from '../utils/AppError';

/**
 * Must be called AFTER express-validator rule arrays in route definitions.
 * Collects all validation errors and returns them as a structured 400 response.
 *
 * Usage:
 *   router.post('/signup', authValidation.signup, validateRequest, signupController)
 */
export const validateRequest = (
  req:  Request,
  res:  Response,
  next: NextFunction
): void => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const formattedErrors = result.array().reduce(
      (acc: Record<string, string>, err: ValidationError) => {
        const field     = err.type === 'field' ? err.path : 'general';
        acc[field]      = err.msg;
        return acc;
      },
      {}
    );

    const error         = new AppError('Validation failed', 400);
    (error as any).errors = formattedErrors;
    return next(error);
  }

  next();
};
