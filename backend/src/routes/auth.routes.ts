import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { verifyToken }      from '../middleware/verifyToken';
import { authRateLimiter }  from '../middleware/rateLimiter';
import { validateRequest }  from '../middleware/validateRequest';
import { authValidation }   from '../validations/schemas';


const router = Router();


// ─── Public Routes (Rate Limited) ─────────────────────────────────────────────


/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
router.post(
  '/signup',
  authRateLimiter,
  authValidation.signup,
  validateRequest,
  authController.signup
);


/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive access + refresh tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful — refresh token set as HttpOnly cookie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  authRateLimiter,
  authValidation.login,
  validateRequest,
  authController.login
);


/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token — returns new access token
 *     security: []
 *     description: Reads refresh token from HttpOnly cookie — no request body needed
 *     responses:
 *       200:
 *         description: New access token returned, refresh cookie rotated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:     { type: boolean, example: true }
 *                 accessToken: { type: string }
 *       401:
 *         description: No cookie present or token revoked
 */
router.post(
  '/refresh',
  authRateLimiter,
  authController.refresh
);


/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset token
 *     security: []
 *     description: Always returns 200 regardless of whether email exists — prevents email enumeration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: 'admin@taskflow.com'
 *     responses:
 *       200:
 *         description: Reset token returned (same response for registered and unregistered emails)
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  authValidation.forgotPassword,
  validateRequest,
  authController.forgotPassword
);


/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using token from forgot-password
 *     security: []
 *     description: Token is single-use — replay attempts return 400
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from forgot-password response
 *               password:
 *                 type: string
 *                 example: 'NewPass@5678'
 *     responses:
 *       200:
 *         description: Password reset successfully — all sessions revoked
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/reset-password',
  authRateLimiter,
  authValidation.resetPassword,
  validateRequest,
  authController.resetPassword
);


// ─── Protected Routes (require valid Bearer token) ────────────────────────────


/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout — revokes refresh token and clears cookie
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Not authenticated
 */
router.post(
  '/logout',
  verifyToken,
  authController.logout
);


/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user profile
 *     description: Returns full user object — password and sensitive fields excluded
 *     responses:
 *       200:
 *         description: User profile returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Not authenticated
 */
router.get(
  '/me',
  verifyToken,
  authController.getMe
);


/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication — signup, login, token refresh, password reset
 */
export default router;
