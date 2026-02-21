/**
 * backend/tests/auth.test.ts
 *
 * Auth API test suite — covers all 7 auth endpoints.
 * Depends on seed data: npm run seed (must be run before npm test)
 *
 * Design decisions:
 *  - Reset-password suite uses a dedicated one-off user to keep seed accounts intact
 *  - Seed users (admin / manager / user) remain unchanged for tasks.test.ts
 *  - All cleanup performed in afterAll hooks
 */

import path   from 'path';
import dotenv from 'dotenv';

// ── Load .env BEFORE any module reads process.env ──────────────────────────
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import request  from 'supertest';
import mongoose from 'mongoose';
import app           from '../src/app';
import { connectDB } from '../src/config/db';
import User          from '../src/models/User.model';
import { COOKIE_NAMES, HTTP_STATUS } from '../src/constants';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE = '/api/v1/auth';

/** Seed users created by: npm run seed */
const ADMIN   = { email: 'admin@taskflow.com',   password: 'Admin@1234'   };
const MANAGER = { email: 'manager@taskflow.com', password: 'Manager@1234' };

/**
 * One-off user created during SUITE 1 and cleaned up in afterAll.
 * Uses timestamp to avoid duplicate key errors on re-runs.
 */
const SIGNUP_EMAIL = `signup.test.${Date.now()}@test.com`;
const NEW_USER     = {
  name:     'Test Signup User',
  email:    SIGNUP_EMAIL,
  password: 'Test@1234',
};

// ─── Helper: Extract refresh_token from Set-Cookie header ────────────────────

const getRefreshCookie = (
  headers: Record<string, string | string[]>
): string => {
  const raw = headers['set-cookie'];
  if (!raw) return '';
  const cookies = Array.isArray(raw) ? raw : [raw];
  return (
    cookies.find(c => c.startsWith(`${COOKIE_NAMES.REFRESH_TOKEN}=`)) ?? ''
  );
};

// ─── DB Lifecycle ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  await connectDB();
}, 30000);

afterAll(async () => {
  // Remove one-off users created by this test suite (not seed users)
  await mongoose.connection
    .collection('users')
    .deleteMany({ email: { $in: [SIGNUP_EMAIL] } });

  await mongoose.disconnect();
}, 15000);

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 1 — POST /auth/signup
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /auth/signup', () => {

  it(
    'TC-AUTH-001 | valid signup → 201, accessToken + user object, sets HttpOnly refresh cookie',
    async () => {
      const res = await request(app)
        .post(`${BASE}/signup`)
        .send(NEW_USER);

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.success).toBe(true);

      // Access token
      expect(res.body.data.accessToken).toBeDefined();
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.body.data.accessToken.split('.')).toHaveLength(3); // valid JWT shape

      // User object
      expect(res.body.data.user.email).toBe(SIGNUP_EMAIL);
      expect(res.body.data.user.role).toBe('user');   // default role
      expect(res.body.data.user.id).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined(); // never exposed

      // httpOnly refresh cookie must be set
      const cookie = getRefreshCookie(res.headers as Record<string, string | string[]>);
      expect(cookie).toContain(`${COOKIE_NAMES.REFRESH_TOKEN}=`);
      expect(cookie).toContain('HttpOnly');
    }
  );

  it(
    'TC-AUTH-002 | duplicate email → 409 Conflict',
    async () => {
      const res = await request(app)
        .post(`${BASE}/signup`)
        .send(NEW_USER); // same email as TC-AUTH-001

      expect(res.status).toBe(HTTP_STATUS.CONFLICT);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-AUTH-003 | missing name → 400 with errors.name field',
    async () => {
      const res = await request(app)
        .post(`${BASE}/signup`)
        .send({ email: 'no-name@test.com', password: 'Test@1234' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.errors?.name).toBeDefined();
    }
  );

  it(
    'TC-AUTH-004 | invalid email format → 400 with errors.email field',
    async () => {
      const res = await request(app)
        .post(`${BASE}/signup`)
        .send({ name: 'Test', email: 'not-an-email', password: 'Test@1234' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.errors?.email).toBeDefined();
    }
  );

  it(
    'TC-AUTH-005 | password under 8 characters → 400',
    async () => {
      const res = await request(app)
        .post(`${BASE}/signup`)
        .send({ name: 'Test', email: 'short-pw@test.com', password: 'S@1' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-AUTH-006 | password missing uppercase letter → 400',
    async () => {
      const res = await request(app)
        .post(`${BASE}/signup`)
        .send({ name: 'Test', email: 'no-upper@test.com', password: 'test@1234' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-AUTH-007 | password missing number → 400',
    async () => {
      const res = await request(app)
        .post(`${BASE}/signup`)
        .send({ name: 'Test', email: 'no-num@test.com', password: 'TestTest@' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 2 — POST /auth/login
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /auth/login', () => {

  it(
    'TC-AUTH-008 | valid credentials → 200, accessToken + user, sets HttpOnly cookie',
    async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send(ADMIN);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.body.data.user.email).toBe(ADMIN.email);
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.user.password).toBeUndefined();

      const cookie = getRefreshCookie(res.headers as Record<string, string | string[]>);
      expect(cookie).toContain(`${COOKIE_NAMES.REFRESH_TOKEN}=`);
      expect(cookie).toContain('HttpOnly');
    }
  );

  it(
    'TC-AUTH-009 | wrong password → 401 Unauthorized',
    async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: ADMIN.email, password: 'WrongPass@999' });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-AUTH-010 | non-existent email → 401 (same status as wrong password — no enumeration)',
    async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: 'ghost@nowhere.com', password: 'Test@1234' });

      // MUST return 401 — identical to wrong password to prevent user enumeration
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-AUTH-011 | missing email field → 400 validation error',
    async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ password: 'Test@1234' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-AUTH-012 | missing password field → 400 validation error',
    async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: ADMIN.email });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 3 — POST /auth/refresh
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /auth/refresh', () => {
  let adminRefreshCookie: string;

  beforeAll(async () => {
    const res = await request(app).post(`${BASE}/login`).send(ADMIN);
    adminRefreshCookie = getRefreshCookie(
      res.headers as Record<string, string | string[]>
    );
  }, 15000);

  it(
    'TC-AUTH-013 | valid cookie → 200, returns new accessToken, rotates refresh cookie',
    async () => {
      const res = await request(app)
        .post(`${BASE}/refresh`)
        .set('Cookie', adminRefreshCookie);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.body.data.accessToken.split('.')).toHaveLength(3);

      // Rotated cookie must be issued
      const newCookie = getRefreshCookie(res.headers as Record<string, string | string[]>);
      expect(newCookie).toContain(`${COOKIE_NAMES.REFRESH_TOKEN}=`);
    }
  );

  it(
    'TC-AUTH-014 | no cookie present → 401 Unauthorized',
    async () => {
      const res = await request(app).post(`${BASE}/refresh`);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-AUTH-017 | replay attack — used refresh token rejected → 401',
    async () => {
      // Login fresh to get a clean token specifically for this test
      const loginRes = await request(app)
        .post(`${BASE}/login`)
        .send(MANAGER);

      const cookie = getRefreshCookie(
        loginRes.headers as Record<string, string | string[]>
      );

      // First use — must succeed and rotate the token
      await request(app)
        .post(`${BASE}/refresh`)
        .set('Cookie', cookie)
        .expect(HTTP_STATUS.OK);

      // Second use — same token must be rejected (already rotated/revoked)
      const replayRes = await request(app)
        .post(`${BASE}/refresh`)
        .set('Cookie', cookie);

      expect(replayRes.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(replayRes.body.success).toBe(false);
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 4 — POST /auth/logout
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /auth/logout', () => {
  let accessToken:    string;
  let refreshCookie:  string;

  beforeAll(async () => {
    const res = await request(app).post(`${BASE}/login`).send(ADMIN);
    accessToken   = res.body.data.accessToken;
    refreshCookie = getRefreshCookie(
      res.headers as Record<string, string | string[]>
    );
  }, 15000);

  it(
    'TC-AUTH-019 | no Authorization header → 401 (protected route)',
    async () => {
      const res = await request(app).post(`${BASE}/logout`);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-AUTH-018 | valid token + cookie → 200, logout confirmed',
    async () => {
      const res = await request(app)
        .post(`${BASE}/logout`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshCookie);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/logged out/i);
    }
  );

  it(
    'TC-AUTH-020 | post-logout refresh attempt with old cookie → 401 (token revoked)',
    async () => {
      // refreshCookie was revoked during TC-AUTH-018 above
      const res = await request(app)
        .post(`${BASE}/refresh`)
        .set('Cookie', refreshCookie);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 5 — GET /auth/me
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /auth/me', () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await request(app).post(`${BASE}/login`).send(ADMIN);
    adminToken = res.body.data.accessToken;
  }, 15000);

  it(
    'TC-AUTH-021 | valid token → 200, returns full user profile',
    async () => {
      const res = await request(app)
        .get(`${BASE}/me`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(ADMIN.email);
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.user.id).toBeDefined();
      expect(res.body.data.user.name).toBeDefined();
    }
  );

  it(
    'TC-AUTH-024 | response must NOT expose sensitive fields',
    async () => {
      const res = await request(app)
        .get(`${BASE}/me`)
        .set('Authorization', `Bearer ${adminToken}`);

      const user = res.body.data.user;
      expect(user.password).toBeUndefined();
      expect(user.passwordResetToken).toBeUndefined();
      expect(user.passwordResetExpires).toBeUndefined(); // verifies GAP-004 fix
    }
  );

  it(
    'TC-AUTH-022 | no Authorization header → 401',
    async () => {
      const res = await request(app).get(`${BASE}/me`);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-AUTH-023 | malformed/tampered JWT token → 401',
    async () => {
      const res = await request(app)
        .get(`${BASE}/me`)
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.tampered.payload');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 6 — POST /auth/forgot-password
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /auth/forgot-password', () => {

  it(
    'TC-AUTH-025 | registered email → 200, resetToken returned in body',
    async () => {
      const res = await request(app)
        .post(`${BASE}/forgot-password`)
        .send({ email: ADMIN.email });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).not.toBeNull();
      expect(typeof res.body.data.resetToken).toBe('string');
      expect(res.body.data.resetToken.length).toBeGreaterThan(10);
    }
  );

  it(
    'TC-AUTH-026 | unregistered email → 200 (same status — prevents email enumeration)',
    async () => {
      const res = await request(app)
        .post(`${BASE}/forgot-password`)
        .send({ email: 'ghost@nobody.com' });

      // MUST return 200 regardless — same status prevents enumeration
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull(); // no token issued for non-existent user
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 7 — POST /auth/reset-password
//
// ⚠️  Uses a dedicated one-off user (not the seed 'user@taskflow.com') so that
//     the seed user password remains 'User@1234' for tasks.test.ts.
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /auth/reset-password', () => {
  const RESET_EMAIL    = `reset.test.${Date.now()}@test.com`;
  const RESET_PASSWORD = 'OriginalPass@1234';

  let resetToken: string;

  beforeAll(async () => {
    // 1. Create a dedicated user for this suite
    await request(app)
      .post(`${BASE}/signup`)
      .send({ name: 'Reset Test User', email: RESET_EMAIL, password: RESET_PASSWORD });

    // 2. Request a reset token for that user
    const forgotRes = await request(app)
      .post(`${BASE}/forgot-password`)
      .send({ email: RESET_EMAIL });

    resetToken = forgotRes.body.data?.resetToken;
  }, 20000);

  afterAll(async () => {
    // Hard-delete the one-off reset test user via native driver
    await mongoose.connection
      .collection('users')
      .deleteOne({ email: RESET_EMAIL });
  });

  it(
    'TC-AUTH-028 | invalid reset token → 400 Bad Request',
    async () => {
      const res = await request(app)
        .post(`${BASE}/reset-password`)
        .send({ token: 'completely-invalid-fake-token-xyz', password: 'NewPass@9999' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-AUTH-027 | valid token + strong new password → 200, password reset confirmed',
    async () => {
      const res = await request(app)
        .post(`${BASE}/reset-password`)
        .send({ token: resetToken, password: 'NewPass@5678' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/reset/i);
      expect(res.body.data).toBeNull();
    }
  );

  it(
    'TC-AUTH-029 | original password rejected after reset — all sessions revoked',
    async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: RESET_EMAIL, password: RESET_PASSWORD }); // original password

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-AUTH-027b | new password accepted after reset — login succeeds',
    async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: RESET_EMAIL, password: 'NewPass@5678' }); // new password

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
    }
  );

  it(
    'TC-AUTH-027c | same reset token cannot be reused — replay prevention',
    async () => {
      const res = await request(app)
        .post(`${BASE}/reset-password`)
        .send({ token: resetToken, password: 'AnotherNew@9999' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    }
  );
});
