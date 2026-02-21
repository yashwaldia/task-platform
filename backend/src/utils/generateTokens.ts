import jwt      from 'jsonwebtoken';
import crypto   from 'crypto';
import { env }  from '../config/env';
import RefreshToken from '../models/RefreshToken.model';
import { TOKEN_EXPIRY_MS } from '../constants';


export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}


export interface JwtPayload {
  userId: string;
  email:  string;
  role:   string;
}


/**
 * Sign and return a short-lived access JWT.
 *
 * NOTE: `expiresIn` is cast via `as unknown as number` because
 * @types/jsonwebtoken v9+ uses the branded `ms.StringValue` type.
 * The env value is validated at startup and is a valid ms-format string (e.g. "15m").
 */
export const generateAccessToken = (
  userId: string,
  email:  string,
  role:   string
): string => {
  const expiresIn = env.JWT_ACCESS_EXPIRES_IN as unknown as number; // ← FIXED: was JWT_ACCESS_EXPIRY

  return jwt.sign(
    { userId, email, role } satisfies JwtPayload,
    env.JWT_ACCESS_SECRET,                                           // ← FIXED: was JWT_SECRET
    { expiresIn }
  );
};


/** Generate a cryptographically secure random token string */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};


/** SHA-256 hash a token for safe storage in MongoDB */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};


/** Persist a hashed refresh token to the database */
export const saveRefreshToken = async (
  userId:   string,
  rawToken: string
): Promise<void> => {
  const hashedToken = hashToken(rawToken);
  const expiresAt   = new Date(Date.now() + TOKEN_EXPIRY_MS.REFRESH);

  await RefreshToken.create({ userId, token: hashedToken, expiresAt });
};


/** Revoke a single refresh token (used on logout / token rotation) */
export const revokeRefreshToken = async (rawToken: string): Promise<void> => {
  const hashedToken = hashToken(rawToken);
  await RefreshToken.findOneAndUpdate(
    { token: hashedToken },
    { isRevoked: true }
  );
};


/** Revoke ALL active refresh tokens for a user (force logout all devices) */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await RefreshToken.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );
};


/**
 * Generate access + refresh token pair and persist the refresh token.
 * Main entry point used by auth service.
 */
export const generateAndSaveTokens = async (
  userId: string,
  email:  string,
  role:   string
): Promise<TokenPair> => {
  const accessToken  = generateAccessToken(userId, email, role);
  const refreshToken = generateRefreshToken();
  await saveRefreshToken(userId, refreshToken);
  return { accessToken, refreshToken };
};
