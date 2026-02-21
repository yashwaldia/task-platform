import crypto from 'crypto';
import User, { IUser } from '../models/User.model';
import RefreshToken from '../models/RefreshToken.model';
import { AppError } from '../utils/AppError';
import {
  generateAndSaveTokens,
  hashToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../utils/generateTokens';

// ─── Input / Output Interfaces ────────────────────────────────────────────────

export interface SignupInput {
  name:     string;
  email:    string;
  password: string;
  role?:    string;
}

export interface AuthResult {
  accessToken:  string;
  refreshToken: string;
  user: {
    id:    string;
    name:  string;
    email: string;
    role:  string;
  };
}

export interface RefreshResult {
  accessToken:  string;
  refreshToken: string;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

class AuthService {

  /**
   * Register a new user account.
   * Password is hashed automatically via User model pre-save hook.
   */
  async signup(input: SignupInput): Promise<AuthResult> {
    const { name, email, password, role } = input;

    // Check if active account with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409);
    }

    // Create user — password hashing handled by pre-save hook
    const user = await User.create({
      name,
      email,
      password,
      role: role ?? 'user',
    });

    const { accessToken, refreshToken } = await generateAndSaveTokens(
      String(user._id),
      user.email,
      user.role
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id:    String(user._id),
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    };
  }

  /**
   * Authenticate a user with email and password.
   * Returns access token + refresh token on success.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Explicitly select password (schema marks it as select: false)
    const user = await User.findOne({ email }).select('+password');

    // Use generic message to prevent user enumeration
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const { accessToken, refreshToken } = await generateAndSaveTokens(
      String(user._id),
      user.email,
      user.role
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id:    String(user._id),
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    };
  }

  /**
   * Refresh token rotation.
   * Validates the existing refresh token, revokes it,
   * and issues a completely new token pair.
   * Prevents refresh token replay attacks.
   */
  async refresh(rawRefreshToken: string): Promise<RefreshResult> {
    const hashedToken = hashToken(rawRefreshToken);

    const tokenRecord = await RefreshToken.findOne({ token: hashedToken });

    if (!tokenRecord || tokenRecord.isRevoked) {
      throw new AppError(
        'Invalid or revoked refresh token. Please log in again.',
        401
      );
    }

    if (tokenRecord.expiresAt < new Date()) {
      // Clean up expired document and reject
      await RefreshToken.findByIdAndDelete(tokenRecord._id);
      throw new AppError('Refresh token expired. Please log in again.', 401);
    }

    // Confirm the user still exists and is not deleted
    const user = await User.findById(tokenRecord.userId);
    if (!user) {
      throw new AppError(
        'The user associated with this token no longer exists.',
        401
      );
    }

    // ROTATION: revoke old token before issuing new pair
    await revokeRefreshToken(rawRefreshToken);

    const { accessToken, refreshToken } = await generateAndSaveTokens(
      String(user._id),
      user.email,
      user.role
    );

    return { accessToken, refreshToken };
  }

  /**
   * Revoke the user's current refresh token.
   * The cookie is cleared in the controller.
   */
  async logout(rawRefreshToken: string): Promise<void> {
    await revokeRefreshToken(rawRefreshToken);
  }

  /**
   * Generate a password reset token and save its hash to the user document.
   * Returns the RAW token (for this assignment — in production, send via email).
   * Returns null silently if email not found (prevents user enumeration).
   */
  async forgotPassword(email: string): Promise<string | null> {
    const user = await User.findOne({ email });

    // Silently return null — controller always returns same response
    // This prevents attackers from discovering which emails are registered
    if (!user) return null;

    // Generate a secure random token
    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Save hash to user document with 10-minute expiry
    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Return RAW token — would normally be sent via email
    return rawToken;
  }

  /**
   * Validate the reset token and apply the new password.
   * Revokes all active refresh tokens to force re-login everywhere.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid (non-expired) token
    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError(
        'Invalid or expired password reset token. Please request a new one.',
        400
      );
    }

    // Set new password — pre-save hook will hash it
    user.password             = newPassword;
    user.passwordResetToken   = null;
    user.passwordResetExpires = null;
    await user.save();

    // Force logout from all devices
    await revokeAllUserTokens(String(user._id));
  }

  /**
   * Return the currently authenticated user's profile.
   * Used by GET /auth/me after verifyToken middleware sets req.user.
   */
  async getMe(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
}

export const authService = new AuthService();
