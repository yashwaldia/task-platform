/**
 * backend/seed/seed.ts
 *
 * Database seeder — creates deterministic test users and tasks for all 3 roles.
 * Safe to re-run: fully cleans previous seed data before inserting fresh records.
 * Uses native MongoDB driver for cleanup to bypass Mongoose soft-delete middleware.
 *
 * Usage (from backend/ directory):
 *   npm run seed
 */

import path   from 'path';
import dotenv from 'dotenv';

// ── Load .env FIRST before any module reads process.env ──────────────────────
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import { connectDB }  from '../src/config/db';
import User           from '../src/models/User.model';
import Task           from '../src/models/Task.model';
import type { UserRole }               from '../src/models/User.model';
import type { TaskStatus, TaskPriority } from '../src/models/Task.model';

// ─── Seed Identity Constants ──────────────────────────────────────────────────
// These emails are the cleanup key — any re-run removes exactly these records

const SEED_EMAILS = [
  'admin@taskflow.com',
  'manager@taskflow.com',
  'user@taskflow.com',
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeedUserInput {
  name:     string;
  email:    string;
  password: string;
  role:     UserRole;
}

// ─── User Definitions ─────────────────────────────────────────────────────────
// Passwords are plain-text here — pre-save bcrypt hook hashes them automatically

const SEED_USERS: SeedUserInput[] = [
  {
    name:     'Admin User',
    email:    'admin@taskflow.com',
    password: 'Admin@1234',
    role:     'admin',
  },
  {
    name:     'Manager User',
    email:    'manager@taskflow.com',
    password: 'Manager@1234',
    role:     'manager',
  },
  {
    name:     'Regular User',
    email:    'user@taskflow.com',
    password: 'User@1234',
    role:     'user',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a Date N days from today (negative = past/overdue) */
const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const divider = (char = '─', len = 68) => char.repeat(len);

// ─── Cleanup ──────────────────────────────────────────────────────────────────

const cleanup = async (): Promise<void> => {
  console.log('\n🧹  Cleaning up previous seed data...');

  // Use native driver to bypass Mongoose soft-delete query middleware.
  // This correctly removes both active AND soft-deleted seed records.
  const usersCol         = mongoose.connection.collection('users');
  const refreshTokensCol = mongoose.connection.collection('refreshtokens');
  const tasksCol         = mongoose.connection.collection('tasks');

  // Find existing seed users (active or soft-deleted)
  const existingUsers = await usersCol
    .find({ email: { $in: [...SEED_EMAILS] } })
    .toArray();

  if (existingUsers.length === 0) {
    console.log('    ℹ️  No existing seed data — skipping cleanup');
    return;
  }

  const existingIds = existingUsers.map(u => u._id);

  // Delete refresh tokens belonging to seed users
  const { deletedCount: rtDeleted } = await refreshTokensCol.deleteMany({
    userId: { $in: existingIds },
  });

  // Delete tasks created by OR assigned to seed users
  const { deletedCount: taskDeleted } = await tasksCol.deleteMany({
    $or: [
      { createdBy:  { $in: existingIds } },
      { assignedTo: { $in: existingIds } },
    ],
  });

  // Finally delete the seed users
  await usersCol.deleteMany({ email: { $in: [...SEED_EMAILS] } });

  console.log(`    ✅  Removed ${existingUsers.length} seed user(s)`);
  console.log(`    ✅  Removed ${rtDeleted}             refresh token(s)`);
  console.log(`    ✅  Removed ${taskDeleted}            seed task(s)`);
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const seed = async (): Promise<void> => {
  console.log('\n' + divider('═'));
  console.log('🌱  TaskFlow — Database Seeder');
  console.log(divider('═'));

  // ── Step 1: Connect ────────────────────────────────────────────────────────
  await connectDB();

  // ── Step 2: Clean ─────────────────────────────────────────────────────────
  await cleanup();

  // ── Step 3: Create Users ───────────────────────────────────────────────────
  // User.create() triggers pre('save') → bcrypt automatically hashes passwords
  console.log('\n👥  Creating seed users...');

  const admin       = await User.create(SEED_USERS[0]);
  const manager     = await User.create(SEED_USERS[1]);
  const regularUser = await User.create(SEED_USERS[2]);

  console.log(`    ✅  admin    created  →  ${admin._id}`);
  console.log(`    ✅  manager  created  →  ${manager._id}`);
  console.log(`    ✅  user     created  →  ${regularUser._id}`);

  // ── Step 4: Create Tasks ───────────────────────────────────────────────────
  // Task model has no pre-save hook — insertMany is safe and efficient.
  // Tasks are distributed to cover all RBAC paths in the test suite.
  console.log('\n📋  Creating seed tasks...');

  interface TaskInput {
    title:       string;
    description: string;
    status:      TaskStatus;
    priority:    TaskPriority;
    assignedTo:  mongoose.Types.ObjectId;
    createdBy:   mongoose.Types.ObjectId;
    dueDate:     Date | null;
    deletedAt:   null;
  }

  const taskDefs: TaskInput[] = [
    // ── Admin-owned tasks ───────────────────────────────────────────────────
    {
      title:       '[SEED] Design system architecture',
      description: 'Define overall system architecture and component breakdown',
      status:      'todo',
      priority:    'high',
      assignedTo:  admin._id,
      createdBy:   admin._id,
      dueDate:     daysFromNow(7),
      deletedAt:   null,
    },
    {
      title:       '[SEED] Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment',
      status:      'in_progress',
      priority:    'high',
      assignedTo:  admin._id,
      createdBy:   admin._id,
      dueDate:     daysFromNow(3),
      deletedAt:   null,
    },

    // ── Manager-owned task (assigned to manager by admin) ───────────────────
    {
      title:       '[SEED] Review authentication module',
      description: 'Code review for JWT authentication implementation',
      status:      'todo',
      priority:    'medium',
      assignedTo:  manager._id,
      createdBy:   admin._id,   // ← admin created, assigned to manager
      dueDate:     daysFromNow(5),
      deletedAt:   null,
    },

    // ── Cross-role task (manager created, assigned to user) ─────────────────
    {
      title:       '[SEED] Write API documentation',
      description: 'Document all REST endpoints with request/response examples',
      status:      'in_progress',
      priority:    'medium',
      assignedTo:  regularUser._id,
      createdBy:   manager._id,  // ← manager created, assigned to user
      dueDate:     daysFromNow(2),
      deletedAt:   null,
    },

    // ── User-owned task (completed) ─────────────────────────────────────────
    {
      title:       '[SEED] Implement user profile page',
      description: 'Build the profile settings page with name update',
      status:      'done',
      priority:    'low',
      assignedTo:  regularUser._id,
      createdBy:   regularUser._id,
      dueDate:     daysFromNow(-1), // ← intentionally overdue for filter tests
      deletedAt:   null,
    },

    // ── Extra task for pagination + filter tests ─────────────────────────────
    {
      title:       '[SEED] Fix login page validation',
      description: 'Edge case — empty fields should show inline validation errors',
      status:      'todo',
      priority:    'low',
      assignedTo:  regularUser._id,
      createdBy:   manager._id,
      dueDate:     null,           // ← no due date — tests null handling
      deletedAt:   null,
    },
  ];

  const tasks = await Task.insertMany(taskDefs);

  tasks.forEach((t, i) => {
    const assignee =
      t.assignedTo.toString() === admin._id.toString()       ? 'admin'   :
      t.assignedTo.toString() === manager._id.toString()     ? 'manager' : 'user';
    console.log(
      `    ✅  Task ${i + 1} [${t.status.padEnd(11)}][${t.priority.padEnd(6)}]` +
      ` assigned→${assignee.padEnd(7)}  id: ${t._id}`
    );
  });

  // ── Step 5: Print Credentials Table ───────────────────────────────────────
  console.log('\n' + divider('═'));
  console.log('✅  Seed Complete\n');
  console.log(divider());
  console.log('  ROLE      EMAIL                    PASSWORD         ID');
  console.log(divider());
  console.log(`  admin     admin@taskflow.com       Admin@1234       ${admin._id}`);
  console.log(`  manager   manager@taskflow.com     Manager@1234     ${manager._id}`);
  console.log(`  user      user@taskflow.com        User@1234        ${regularUser._id}`);
  console.log(divider());

  console.log('\n  TASK INDEX → ID (reference for test files)');
  console.log(divider());
  tasks.forEach((t, i) => {
    console.log(`  [${i}] ${t._id}  "${t.title}"`);
  });
  console.log(divider());
  console.log('\n  RBAC Coverage:');
  console.log('  • Tasks 0–1 : created by admin,   assigned to admin');
  console.log('  • Task  2   : created by admin,   assigned to manager');
  console.log('  • Tasks 3,5 : created by manager, assigned to user');
  console.log('  • Task  4   : created by user,    assigned to user  (done + overdue)');
  console.log('\n');

  // ── Step 6: Disconnect ─────────────────────────────────────────────────────
  await mongoose.disconnect();
  console.log('🔌  [Seed] Disconnected from MongoDB\n');
};

// ─── Execute ──────────────────────────────────────────────────────────────────

seed().catch((error: unknown) => {
  console.error('\n❌  [Seed] Fatal error:', error);
  mongoose.disconnect().finally(() => process.exit(1));
});
