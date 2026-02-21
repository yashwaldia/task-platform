import { Request, Response, NextFunction } from 'express';
import jwt                from 'jsonwebtoken';
import { env }            from '../config/env';
import { AppError }       from '../utils/AppError';
import User               from '../models/User.model';
import { JwtPayload }     from '../utils/generateTokens';


export const verifyToken = async (
  req:  Request,
  res:  Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication token not provided', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication token not provided', 401);
    }

    // Verify the JWT signature and expiry
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload; // ← FIXED: was env.JWT_SECRET

    // Confirm user still exists (not soft-deleted)
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('The user belonging to this token no longer exists', 401);
    }

    // Attach user context to request for downstream use
    req.user = {
      userId: String(user._id),
      email:  user.email,
      role:   user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    next(error);
  }
};
