import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'Task Platform API',
      version:     '1.0.0',
      description: 'REST API for Task Platform — Authentication, Task Management, User Management (RBAC)',
      contact: {
        name: 'Task Platform',
      },
    },
    servers: [
      {
        url:         'http://localhost:4000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
          description:  'Enter your access token from /auth/login or /auth/signup',
        },
      },
      schemas: {
        // ── Reusable response wrappers ─────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data:    { type: 'object', nullable: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors:  { type: 'object', nullable: true },
          },
        },
        // ── User ──────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id:        { type: 'string', example: '64b1f2c3d4e5f6a7b8c9d0e1' },
            name:      { type: 'string', example: 'Jane Smith' },
            email:     { type: 'string', example: 'jane@example.com' },
            role:      { type: 'string', enum: ['admin', 'manager', 'user'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Task ──────────────────────────────────────────────────────
        Task: {
          type: 'object',
          properties: {
            _id:         { type: 'string', example: '64b1f2c3d4e5f6a7b8c9d0e2' },
            title:       { type: 'string', example: 'Fix login bug' },
            description: { type: 'string', example: 'Users cannot log in with Google OAuth' },
            status:      { type: 'string', enum: ['todo', 'in_progress', 'done'] },
            priority:    { type: 'string', enum: ['low', 'medium', 'high'] },
            assignedTo:  { $ref: '#/components/schemas/User' },
            createdBy:   { $ref: '#/components/schemas/User' },
            dueDate:     { type: 'string', format: 'date-time', nullable: true },
            deletedAt:   { type: 'string', format: 'date-time', nullable: true },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
          },
        },
        // ── Auth payloads ─────────────────────────────────────────────
        SignupRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name:     { type: 'string', example: 'Jane Smith' },
            email:    { type: 'string', example: 'jane@example.com' },
            password: { type: 'string', example: 'Secret@123' },
            role:     { type: 'string', enum: ['admin', 'manager', 'user'], description: 'Optional — defaults to user' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', example: 'admin@taskflow.com' },
            password: { type: 'string', example: 'Admin@1234' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success:     { type: 'boolean', example: true },
            message:     { type: 'string' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                user:        { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        // ── Task payloads ─────────────────────────────────────────────
        CreateTaskRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title:       { type: 'string', example: 'Implement dark mode' },
            description: { type: 'string', example: 'Add CSS variables for dark theme' },
            priority:    { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
            assignedTo:  { type: 'string', example: '64b1f2c3d4e5f6a7b8c9d0e1', description: 'User ID — omit for user role (auto-assigned to self)' },
            dueDate:     { type: 'string', format: 'date', example: '2026-03-01' },
          },
        },
        UpdateStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Glob pattern — picks up all JSDoc @swagger blocks from route files
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
