import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/**
 * Role-based access control middleware.
 * Usage: router.get('/admin', verifyToken, checkRole('admin'), handler)
 * Usage: router.get('/team',  verifyToken, checkRole('admin', 'manager'), handler)
 */
export const checkRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};
