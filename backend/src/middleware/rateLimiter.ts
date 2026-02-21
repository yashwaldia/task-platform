import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError';

/**
 * Skip rate limiting entirely during automated tests.
 * NODE_ENV=test is set by the npm test script.
 * Limiters remain fully active in development and production.
 */
const isTestEnvironment = (): boolean => process.env.NODE_ENV === 'test';


/** General API rate limiter: 100 requests / 15 minutes */
export const apiRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            isTestEnvironment, // ← ADDED: bypass in test environment
  handler:         (req, res, next) => {
    next(new AppError('Too many requests. Please try again in 15 minutes.', 429));
  },
});


/** Strict auth rate limiter: 10 attempts / 15 minutes (login, signup, forgot-password) */
export const authRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            isTestEnvironment, // ← ADDED: bypass in test environment
  handler:         (req, res, next) => {
    next(
      new AppError(
        'Too many authentication attempts. Please wait 15 minutes before trying again.',
        429
      )
    );
  },
});
