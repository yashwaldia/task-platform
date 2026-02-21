import { body, param, query } from 'express-validator';


// ─── Auth Validations ────────────────────────────────────────────────────────


export const authValidation = {
  signup: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),

    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('role')
      .optional()
      .isIn(['admin', 'manager', 'user']).withMessage('Role must be admin, manager, or user'),
  ],

  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),

    body('password')
      .notEmpty().withMessage('Password is required'),
  ],

  forgotPassword: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),
  ],

  resetPassword: [
    body('token')
      .notEmpty().withMessage('Reset token is required'),

    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
};


// ─── Task Validations ────────────────────────────────────────────────────────


export const taskValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Task title is required')
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),

    body('status')
      .optional()
      .isIn(['todo', 'in_progress', 'done']).withMessage('Status must be todo, in_progress, or done'),

    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),

    /**
     * FIX TC-TASK-003: assignedTo is now optional at the validator layer.
     *
     * Previous: .notEmpty() rejected missing assignedTo with 400 immediately,
     *           service self-assign override for user role never executed.
     *
     * Now:  Validator passes through — service enforces:
     *         user role  → assignedTo forced to requesterId (self-assign)
     *         admin/mgr  → assignedTo undefined → ObjectId.isValid(undefined)
     *                      returns false → AppError 400 (still required for them)
     *
     * Format check (.isMongoId) is preserved: if provided, must be valid ObjectId.
     */
    body('assignedTo')
      .optional()                                                      // ← CHANGED: was .notEmpty()
      .isMongoId().withMessage('assignedTo must be a valid user ID'),  // ← unchanged

    body('dueDate')
      .optional({ nullable: true })
      .isISO8601().withMessage('dueDate must be a valid ISO 8601 date'),
  ],

  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),

    body('status')
      .optional()
      .isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status'),

    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),

    body('assignedTo')
      .optional()
      .isMongoId().withMessage('assignedTo must be a valid user ID'),

    body('dueDate')
      .optional({ nullable: true })
      .isISO8601().withMessage('dueDate must be a valid ISO 8601 date'),
  ],

  updateStatus: [
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['todo', 'in_progress', 'done']).withMessage('Status must be todo, in_progress, or done'),
  ],
};


// ─── User Validations ────────────────────────────────────────────────────────


export const userValidation = {
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('role')
      .optional()
      .isIn(['admin', 'manager', 'user']).withMessage('Role must be admin, manager, or user'),
  ],
  idParam: [
    param('id')
      .isMongoId().withMessage('Invalid user ID format'),
  ],
};


// ─── Pagination / Filter Validations ────────────────────────────────────────


export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isString().withMessage('sortBy must be a string'),

  query('order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
];


export const taskFilterValidation = [
  ...paginationValidation,

  query('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status filter'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Invalid priority filter'),

  query('assignedTo')
    .optional()
    .isMongoId().withMessage('assignedTo filter must be a valid user ID'),
];
