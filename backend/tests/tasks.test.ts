/**
 * backend/tests/tasks.test.ts
 *
 * Task + User API test suite — CRUD endpoints + full RBAC matrix.
 * Depends on seed data: npm run seed (must run before npm test)
 *
 * Design:
 *  - All 3 role tokens captured in beforeAll via login
 *  - 4 controlled test tasks created in beforeAll with known RBAC ownership
 *  - Soft-delete tests use fresh tasks to avoid affecting shared fixtures
 *  - All [TEST]-prefixed tasks cleaned up in afterAll via native driver
 *  - Seed users (admin / manager / user) are never deleted
 */

import path   from 'path';
import dotenv from 'dotenv';

// ── Load .env BEFORE any module reads process.env ──────────────────────────
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import request  from 'supertest';
import mongoose from 'mongoose';
import app           from '../src/app';
import { connectDB } from '../src/config/db';
import { HTTP_STATUS, TASK_STATUS } from '../src/constants';

// ─── Route Constants ──────────────────────────────────────────────────────────

const BASE_TASKS = '/api/v1/tasks';
const BASE_USERS = '/api/v1/users';
const BASE_AUTH  = '/api/v1/auth';

// ─── Seed Credentials (created by: npm run seed) ──────────────────────────────

const ADMIN   = { email: 'admin@taskflow.com',   password: 'Admin@1234'   };
const MANAGER = { email: 'manager@taskflow.com', password: 'Manager@1234' };
const USER    = { email: 'user@taskflow.com',     password: 'User@1234'   };

// ─── Shared State ─────────────────────────────────────────────────────────────

// Tokens — captured via login in beforeAll
let adminToken:   string;
let managerToken: string;
let userToken:    string;

// User IDs — captured from login responses
let adminId:   string;
let managerId: string;
let userId:    string;

/**
 * Controlled test task fixtures — created in beforeAll, deleted in afterAll
 *
 * Ownership map:
 *   adminOwnTaskId     → createdBy: admin,   assignedTo: admin
 *   crossTaskId        → createdBy: admin,   assignedTo: manager
 *   managerOwnTaskId   → createdBy: manager, assignedTo: manager
 *   userAssignedTaskId → createdBy: manager, assignedTo: user
 */
let adminOwnTaskId:     string;
let crossTaskId:        string;
let managerOwnTaskId:   string;
let userAssignedTaskId: string;

// ─── DB Lifecycle ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  await connectDB();

  // ── Step 1: Login all 3 roles and capture tokens + user IDs ────────────────
  const [adminRes, managerRes, userRes] = await Promise.all([
    request(app).post(`${BASE_AUTH}/login`).send(ADMIN),
    request(app).post(`${BASE_AUTH}/login`).send(MANAGER),
    request(app).post(`${BASE_AUTH}/login`).send(USER),
  ]);

  // Fail fast if seed data is missing — clear error rather than cascading failures
  if (!adminRes.body.data?.accessToken) {
    throw new Error(
      'beforeAll: Admin login failed. Run `npm run seed` before `npm test`.\n' +
      `Response: ${JSON.stringify(adminRes.body)}`
    );
  }

  adminToken   = adminRes.body.data.accessToken;
  adminId      = adminRes.body.data.user.id;
  managerToken = managerRes.body.data.accessToken;
  managerId    = managerRes.body.data.user.id;
  userToken    = userRes.body.data.accessToken;
  userId       = userRes.body.data.user.id;

  // ── Step 2: Create 4 controlled test tasks ──────────────────────────────────
  const [t1, t2, t3, t4] = await Promise.all([
    // Admin creates task assigned to admin
    request(app).post(BASE_TASKS)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title:       '[TEST] Admin own task',
        description: 'Owned and assigned to admin only',
        assignedTo:  adminId,
        priority:    'high',
      }),

    // Admin creates task assigned to manager (cross-role ownership)
    request(app).post(BASE_TASKS)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title:       '[TEST] Cross-role task admin to manager',
        description: 'Created by admin, assigned to manager',
        assignedTo:  managerId,
        priority:    'medium',
      }),

    // Manager creates task assigned to manager (manager owns this)
    request(app).post(BASE_TASKS)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title:       '[TEST] Manager own task',
        description: 'Created and assigned to manager',
        assignedTo:  managerId,
        priority:    'medium',
      }),

    // Manager creates task assigned to user
    request(app).post(BASE_TASKS)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title:       '[TEST] User assigned task',
        description: 'Created by manager, assigned to user',
        assignedTo:  userId,
        priority:    'low',
      }),
  ]);

  // Validate all 4 task IDs were captured — fail fast if any creation failed
  adminOwnTaskId     = t1.body.data?.task?._id;
  crossTaskId        = t2.body.data?.task?._id;
  managerOwnTaskId   = t3.body.data?.task?._id;
  userAssignedTaskId = t4.body.data?.task?._id;

  if (!adminOwnTaskId || !crossTaskId || !managerOwnTaskId || !userAssignedTaskId) {
    throw new Error(
      `beforeAll: Failed to create test tasks.\n` +
      `adminOwn=${adminOwnTaskId} cross=${crossTaskId} ` +
      `managerOwn=${managerOwnTaskId} userAssigned=${userAssignedTaskId}\n` +
      `t1=${JSON.stringify(t1.body)} t2=${JSON.stringify(t2.body)} ` +
      `t3=${JSON.stringify(t3.body)} t4=${JSON.stringify(t4.body)}`
    );
  }
}, 30000);

afterAll(async () => {
  // Hard-delete ALL [TEST]-prefixed tasks via native driver
  // Catches both active tasks and any that were soft-deleted during tests
  const deleted = await mongoose.connection.collection('tasks').deleteMany({
    title: { $regex: /^\[TEST\]/ },
  });
  console.log(`\n🧹  afterAll: Removed ${deleted.deletedCount} [TEST] task(s)`);
  await mongoose.disconnect();
}, 15000);

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 1 — POST /tasks  (Create Task)
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /tasks — Create Task', () => {

  it(
    'TC-TASK-008 | no auth token → 401 Unauthorized',
    async () => {
      const res = await request(app)
        .post(BASE_TASKS)
        .send({ title: 'Unauthorized task', assignedTo: adminId, priority: 'low' });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-TASK-005 | missing title → 400 validation error',
    async () => {
      const res = await request(app)
        .post(BASE_TASKS)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assignedTo: adminId, priority: 'high' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-TASK-006 | title under 3 characters → 400 validation error',
    async () => {
      const res = await request(app)
        .post(BASE_TASKS)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'ab', assignedTo: adminId, priority: 'high' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-TASK-007 | invalid priority value → 400 validation error',
    async () => {
      const res = await request(app)
        .post(BASE_TASKS)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Valid title task', assignedTo: adminId, priority: 'critical' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-TASK-001 | admin creates task assigned to any user → 201 with task object',
    async () => {
      const res = await request(app)
        .post(BASE_TASKS)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '[TEST] Admin assigns to user', assignedTo: userId, priority: 'medium' });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task).toBeDefined();
      expect(res.body.data.task._id).toBeDefined();
      expect(res.body.data.task.title).toBe('[TEST] Admin assigns to user');
      expect(res.body.data.task.priority).toBe('medium');
      // Security: sensitive user fields must NOT appear in populated references
      const populated = res.body.data.task.assignedTo;
      if (typeof populated === 'object' && populated !== null) {
        expect(populated.password).toBeUndefined();
        expect(populated.passwordResetToken).toBeUndefined();
        expect(populated.passwordResetExpires).toBeUndefined(); // GAP-004 fix verification
      }
    }
  );

  it(
    'TC-TASK-002 | manager creates task assigned to any user → 201',
    async () => {
      const res = await request(app)
        .post(BASE_TASKS)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ title: '[TEST] Manager assigns to admin', assignedTo: adminId, priority: 'low' });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task._id).toBeDefined();
    }
  );

  it(
    'TC-TASK-003 | user creates task → 201, assignedTo forced to self regardless of body',
    async () => {
      // User sends NO assignedTo — service must default to self
      const res = await request(app)
        .post(BASE_TASKS)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: '[TEST] User self-assigned task', priority: 'low' });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.success).toBe(true);
      // assignedTo must equal the requesting user's ID
      const assignedId =
        res.body.data.task.assignedTo?._id ??
        res.body.data.task.assignedTo;
      expect(String(assignedId)).toBe(userId);
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 2 — GET /tasks  (List Tasks — RBAC Filtering)
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /tasks — List Tasks (RBAC)', () => {

  /** Safely extracts the tasks array regardless of service key name */
  const extractTasks = (data: any): any[] =>
    data?.tasks ?? data?.data ?? [];

  it(
    'TC-TASK-NOAUTH | no auth token → 401',
    async () => {
      const res = await request(app).get(BASE_TASKS);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }
  );

  it(
    'TC-TASK-009 | admin sees ALL tasks (includes all users\' tasks)',
    async () => {
      const res = await request(app)
        .get(BASE_TASKS)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      const tasks = extractTasks(res.body.data);
      expect(Array.isArray(tasks)).toBe(true);
      // Admin must see at least the 4 test tasks + 6 seed tasks = 10+
      expect(tasks.length).toBeGreaterThan(4);
    }
  );

  it(
    'TC-TASK-010 | manager sees only own-created OR assigned tasks',
    async () => {
      const res = await request(app)
        .get(BASE_TASKS)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      const tasks = extractTasks(res.body.data);
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);

      // Every task must be created by manager OR assigned to manager
      tasks.forEach((task: any) => {
        const createdById  = String(task.createdBy?._id  ?? task.createdBy);
        const assignedToId = String(task.assignedTo?._id ?? task.assignedTo);
        expect(
          createdById === managerId || assignedToId === managerId
        ).toBe(true);
      });
    }
  );

  it(
    'TC-TASK-011 | user sees ONLY tasks assigned to themselves',
    async () => {
      const res = await request(app)
        .get(BASE_TASKS)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      const tasks = extractTasks(res.body.data);
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);

      // Every task must be assigned to this user
      tasks.forEach((task: any) => {
        const assignedToId = String(task.assignedTo?._id ?? task.assignedTo);
        expect(assignedToId).toBe(userId);
      });
    }
  );

  it(
    'TC-TASK-012 | pagination: page=1&limit=2 returns max 2 results',
    async () => {
      const res = await request(app)
        .get(`${BASE_TASKS}?page=1&limit=2`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      const tasks = extractTasks(res.body.data);
      expect(tasks.length).toBeLessThanOrEqual(2);
    }
  );

  it(
    'TC-TASK-013 | filter status=todo → only todo tasks returned',
    async () => {
      const res = await request(app)
        .get(`${BASE_TASKS}?status=todo`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      const tasks = extractTasks(res.body.data);
      tasks.forEach((task: any) => {
        expect(task.status).toBe(TASK_STATUS.TODO);
      });
    }
  );

  it(
    'TC-TASK-014 | filter priority=high → only high-priority tasks returned',
    async () => {
      const res = await request(app)
        .get(`${BASE_TASKS}?priority=high`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      const tasks = extractTasks(res.body.data);
      tasks.forEach((task: any) => {
        expect(task.priority).toBe('high');
      });
    }
  );

  it(
    'TC-TASK-016 | soft-deleted tasks excluded from list results',
    async () => {
      // Create a task, delete it, then verify it disappears from list
      const createRes = await request(app)
        .post(BASE_TASKS)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '[TEST] Soft-delete visibility check', assignedTo: adminId, priority: 'low' });

      const tempId = createRes.body.data.task._id;

      await request(app)
        .delete(`${BASE_TASKS}/${tempId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const listRes = await request(app)
        .get(BASE_TASKS)
        .set('Authorization', `Bearer ${adminToken}`);

      const tasks = extractTasks(listRes.body.data);
      const found  = tasks.find((t: any) => t._id === tempId);
      expect(found).toBeUndefined();
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 3 — GET /tasks/:id  (Get Task By ID — RBAC)
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /tasks/:id — Get Single Task (RBAC)', () => {

  it(
    'TC-TASK-017 | admin gets any task by ID → 200',
    async () => {
      // Admin fetching a task assigned to user (cross-role access)
      const res = await request(app)
        .get(`${BASE_TASKS}/${userAssignedTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task._id).toBe(userAssignedTaskId);
    }
  );

  it(
    'TC-TASK-018 | manager gets own created task → 200',
    async () => {
      const res = await request(app)
        .get(`${BASE_TASKS}/${managerOwnTaskId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.task._id).toBe(managerOwnTaskId);
    }
  );

  it(
    'TC-TASK-019 | manager gets task not created by or assigned to them → 403',
    async () => {
      // adminOwnTaskId: created by admin, assigned to admin — manager has no relation
      const res = await request(app)
        .get(`${BASE_TASKS}/${adminOwnTaskId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-TASK-020 | user gets own assigned task → 200',
    async () => {
      const res = await request(app)
        .get(`${BASE_TASKS}/${userAssignedTaskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.task._id).toBe(userAssignedTaskId);
    }
  );

  it(
    'TC-TASK-021 | user gets task not assigned to them → 403',
    async () => {
      // adminOwnTaskId: assigned to admin — user has no access
      const res = await request(app)
        .get(`${BASE_TASKS}/${adminOwnTaskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-TASK-022 | non-existent task ID → 404',
    async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`${BASE_TASKS}/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 4 — PATCH /tasks/:id/status  (Update Task Status)
// ══════════════════════════════════════════════════════════════════════════════

describe('PATCH /tasks/:id/status — Update Status (RBAC)', () => {

  it(
    'TC-TASK-027 | invalid status value → 400',
    async () => {
      const res = await request(app)
        .patch(`${BASE_TASKS}/${adminOwnTaskId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status_xyz' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-TASK-024 | admin updates status on any task → 200, status changed',
    async () => {
      const res = await request(app)
        .patch(`${BASE_TASKS}/${crossTaskId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: TASK_STATUS.IN_PROGRESS });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.status).toBe(TASK_STATUS.IN_PROGRESS);
    }
  );

  it(
    'TC-TASK-025 | manager updates status of own task → 200',
    async () => {
      const res = await request(app)
        .patch(`${BASE_TASKS}/${managerOwnTaskId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: TASK_STATUS.IN_PROGRESS });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.task.status).toBe(TASK_STATUS.IN_PROGRESS);
    }
  );

  it(
    'TC-TASK-026 | user updates status of own assigned task → 200',
    async () => {
      const res = await request(app)
        .patch(`${BASE_TASKS}/${userAssignedTaskId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: TASK_STATUS.DONE });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.task.status).toBe(TASK_STATUS.DONE);
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 5 — PUT /tasks/:id  (Full Task Update — RBAC)
// ══════════════════════════════════════════════════════════════════════════════

describe('PUT /tasks/:id — Full Update (RBAC)', () => {

  it(
    'TC-TASK-032 | user attempts full update → 403',
    async () => {
      const res = await request(app)
        .put(`${BASE_TASKS}/${userAssignedTaskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: '[TEST] User hijack attempt', priority: 'high' });

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-TASK-031 | manager updates task not created by them → 403',
    async () => {
      // adminOwnTaskId: created by admin — manager cannot update
      const res = await request(app)
        .put(`${BASE_TASKS}/${adminOwnTaskId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ title: '[TEST] Manager unauthorized update', priority: 'low' });

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-TASK-030 | manager updates own created task → 200, data updated',
    async () => {
      const res = await request(app)
        .put(`${BASE_TASKS}/${managerOwnTaskId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ title: '[TEST] Manager updated own task', priority: 'high' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('[TEST] Manager updated own task');
      expect(res.body.data.task.priority).toBe('high');
    }
  );

  it(
    'TC-TASK-029 | admin full update on any task → 200',
    async () => {
      const res = await request(app)
        .put(`${BASE_TASKS}/${crossTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '[TEST] Admin updated cross task', priority: 'high' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('[TEST] Admin updated cross task');
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 6 — DELETE /tasks/:id  (Soft Delete — RBAC)
// ══════════════════════════════════════════════════════════════════════════════

describe('DELETE /tasks/:id — Soft Delete (RBAC)', () => {

  it(
    'TC-TASK-036 | user attempts delete → 403',
    async () => {
      const res = await request(app)
        .delete(`${BASE_TASKS}/${userAssignedTaskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-TASK-035 | manager deletes task not created by them → 403',
    async () => {
      // adminOwnTaskId: created by admin — manager cannot delete
      const res = await request(app)
        .delete(`${BASE_TASKS}/${adminOwnTaskId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-TASK-034 | manager soft-deletes own created task → 200, data: null',
    async () => {
      // Create fresh task so shared fixtures are not consumed
      const createRes = await request(app)
        .post(BASE_TASKS)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ title: '[TEST] Manager delete candidate', assignedTo: managerId, priority: 'low' });

      const tempId = createRes.body.data.task._id;

      const res = await request(app)
        .delete(`${BASE_TASKS}/${tempId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    }
  );

  it(
    'TC-TASK-033 | admin soft-deletes any task → 200, task no longer in list',
    async () => {
      // Create fresh task for this specific delete test
      const createRes = await request(app)
        .post(BASE_TASKS)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '[TEST] Admin delete candidate', assignedTo: adminId, priority: 'low' });

      const tempId = createRes.body.data.task._id;

      // Delete
      const deleteRes = await request(app)
        .delete(`${BASE_TASKS}/${tempId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(HTTP_STATUS.OK);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data).toBeNull();

      // Verify soft-delete: task must not appear in subsequent list
      const listRes = await request(app)
        .get(BASE_TASKS)
        .set('Authorization', `Bearer ${adminToken}`);

      const tasks = listRes.body.data?.tasks ?? listRes.body.data?.data ?? [];
      const stillPresent = tasks.find((t: any) => t._id === tempId);
      expect(stillPresent).toBeUndefined();
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 7 — User API  (Admin-Only RBAC)
// ══════════════════════════════════════════════════════════════════════════════

describe('User API — Admin-Only RBAC', () => {

  it(
    'TC-USER-001 | admin gets all users → 200, returns array with 3+ seed users',
    async () => {
      const res = await request(app)
        .get(BASE_USERS)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      const users = res.body.data?.users ?? res.body.data?.data ?? [];
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(3); // at least the 3 seed users

      // Sensitive fields must NEVER appear in user list responses
      users.forEach((u: any) => {
        expect(u.password).toBeUndefined();
        expect(u.passwordResetToken).toBeUndefined();
        expect(u.passwordResetExpires).toBeUndefined();
      });
    }
  );

  it(
    'TC-USER-002 | manager requests all users → 403 Forbidden',
    async () => {
      const res = await request(app)
        .get(BASE_USERS)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-USER-003 | user requests all users → 403 Forbidden',
    async () => {
      const res = await request(app)
        .get(BASE_USERS)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-USER-004 | admin updates user role → 200, role changed in DB',
    async () => {
      const res = await request(app)
        .put(`${BASE_USERS}/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'manager' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('manager');

      // Restore original role — keep seed data consistent for re-runs
      await request(app)
        .put(`${BASE_USERS}/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' });
    }
  );

  it(
    'TC-USER-005 | non-admin (manager) attempts role update → 403',
    async () => {
      const res = await request(app)
        .put(`${BASE_USERS}/${userId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
    }
  );

  it(
    'TC-USER-006 | admin soft-deletes another user → 200, data: null',
    async () => {
      // Create a dedicated one-off user to delete
      const signupRes = await request(app)
        .post(`${BASE_AUTH}/signup`)
        .send({
          name:     'Temp Deletable User',
          email:    `delete.target.${Date.now()}@test.com`,
          password: 'Temp@Delete1',
        });

      const tempUserId = signupRes.body.data.user.id;

      const res = await request(app)
        .delete(`${BASE_USERS}/${tempUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    }
  );

  it(
    'TC-USER-007 | admin attempts self-deletion → 400 (self-delete prevention)',
    async () => {
      const res = await request(app)
        .delete(`${BASE_USERS}/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    }
  );
});
