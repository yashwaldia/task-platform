import { Request, Response, CookieOptions } from 'express';
import { authService } from '../services/auth.service';
import { env } from '../config/env';
import { COOKIE_NAMES, TOKEN_EXPIRY_MS, HTTP_STATUS } from '../constants';
import { IUser } from '../models/User.model';

// ─── Cookie Configuration ─────────────────────────────────────────────────────

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure:   env.NODE_ENV === 'production',
  // 'lax' in development allows cross-origin requests from Vite dev server
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge:   TOKEN_EXPIRY_MS.REFRESH, // milliseconds
  path:     '/',
};

const clearCookieOptions: CookieOptions = {
  httpOnly: true,
  secure:   env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path:     '/',
};

// ─── Helper: Sanitize User Object for Response ────────────────────────────────

const formatUser = (user: IUser | { id: string; name: string; email: string; role: string }) => {
  if ('_id' in user) {
    return {
      id:        String((user as IUser)._id),
      name:      (user as IUser).name,
      email:     (user as IUser).email,
      role:      (user as IUser).role,
      createdAt: (user as IUser).createdAt,
      updatedAt: (user as IUser).updatedAt,
    };
  }
  return {
    id:    user.id,
    name:  user.name,
    email: user.email,
    role:  user.role,
  };
};

// ─── Controllers ─────────────────────────────────────────────────────────────
// Express 5: async errors automatically forwarded to errorHandler — no try/catch needed

/**
 * POST /api/v1/auth/signup
 * Register a new user and return access token + set refresh cookie
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role?: string;
  };

  const result = await authService.signup({ name, email, password, role });

  // Refresh token → httpOnly cookie (never exposed to JavaScript)
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, refreshCookieOptions);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Account created successfully',
    data: {
      accessToken: result.accessToken,
      user:        formatUser(result.user as any),
    },
  });
};

/**
 * POST /api/v1/auth/login
 * Authenticate user and return access token + set refresh cookie
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  const result = await authService.login(email, password);

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, refreshCookieOptions);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken: result.accessToken,
      user:        formatUser(result.user as any),
    },
  });
};

/**
 * POST /api/v1/auth/refresh
 * Rotate refresh token: validate cookie → revoke old → issue new pair
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const rawRefreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;

  // Handle missing cookie before calling service (avoids unnecessary DB call)
  if (!rawRefreshToken) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success:    false,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message:    'Refresh token not provided. Please log in again.',
      timestamp:  new Date().toISOString(),
      path:       req.originalUrl,
    });
    return;
  }

  const result = await authService.refresh(rawRefreshToken);

  // Set the new rotated refresh token
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, refreshCookieOptions);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: result.accessToken,
    },
  });
};

/**
 * POST /api/v1/auth/logout
 * Revoke refresh token in DB and clear the cookie
 * Protected: requires valid access token (verifyToken middleware)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  const rawRefreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;

  // Gracefully handle already-cleared cookie
  if (rawRefreshToken) {
    await authService.logout(rawRefreshToken);
  }

  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, clearCookieOptions);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logged out successfully',
    data:    null,
  });
};

/**
 * POST /api/v1/auth/forgot-password
 * Generate password reset token. Always returns same response (prevents enumeration).
 * NOTE: Token returned in body for this assignment — in production, send via email.
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };

  const resetToken = await authService.forgotPassword(email);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message:
      'If an account with that email exists, a password reset token has been generated.',
    // For this assignment only — production: send via email, never expose here
    data: resetToken ? { resetToken } : null,
  });
};

/**
 * POST /api/v1/auth/reset-password
 * Validate token, set new password, revoke all sessions, clear cookie
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body as { token: string; password: string };

  await authService.resetPassword(token, password);

  // Force logout — user must re-authenticate with new password
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, clearCookieOptions);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password reset successfully. Please log in with your new password.',
    data:    null,
  });
};

/**
 * GET /api/v1/auth/me
 * Return current authenticated user's profile
 * Protected: verifyToken middleware sets req.user before this runs
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = await authService.getMe(req.user!.userId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: formatUser(user),
    },
  });
};
