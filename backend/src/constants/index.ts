export const ROLES = {
  ADMIN:   'admin',
  MANAGER: 'manager',
  USER:    'user',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const TASK_STATUS = {
  TODO:        'todo',
  IN_PROGRESS: 'in_progress',
  DONE:        'done',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_PRIORITY = {
  LOW:    'low',
  MEDIUM: 'medium',
  HIGH:   'high',
} as const;

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

export const COOKIE_NAMES = {
  REFRESH_TOKEN: 'refresh_token',
} as const;

export const TOKEN_EXPIRY_MS = {
  REFRESH: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
} as const;

export const HTTP_STATUS = {
  OK:                    200,
  CREATED:               201,
  NO_CONTENT:            204,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  TOO_MANY_REQUESTS:     429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
