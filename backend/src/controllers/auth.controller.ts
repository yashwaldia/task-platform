import { Request, Response, CookieOptions } from 'express';
import { authService } from '../services/auth.service';
import { env } from '../config/env';
import { COOKIE_NAMES, TOKEN_EXPIRY_MS, HTTP_STATUS } from '../constants';
import { IUser } from '../models/User.model';

// ─── Cookie Configuration ─────────────────────────────────────────────────────
// SameSite must be 'none' in production because frontend (vercel.app) and
// backend (railway.app) are on different domains. SameSite=none requires
// Secure=true. In development, 'lax' works fine on the same localhost origin.

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure:   true,
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:   TOKEN_EXPIRY_MS.REFRESH,
  path:     '/',
};

const clearCookieOptions: CookieOptions = {
  httpOnly: true,
  secure:   true,
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
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

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role?: string;
  };

  const result = await authService.signup({ name, email, password, role });

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

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const rawRefreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;

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

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, refreshCookieOptions);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: result.accessToken,
    },
  });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const rawRefreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;

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

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };

  const resetToken = await authService.forgotPassword(email);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message:
      'If an account with that email exists, a password reset token has been generated.',
    data: resetToken ? { resetToken } : null,
  });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body as { token: string; password: string };

  await authService.resetPassword(token, password);

  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, clearCookieOptions);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password reset successfully. Please log in with your new password.',
    data:    null,
  });
};

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
