import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { verifyToken }     from '../middleware/verifyToken';
import { checkRole }       from '../middleware/checkRole';
import { validateRequest } from '../middleware/validateRequest';
import { taskValidation, taskFilterValidation } from '../validations/schemas';

const router = Router();

// All task routes require authentication
router.use(verifyToken);

/**
 * GET /api/v1/tasks
 * All authenticated roles — results filtered by role in service layer
 */
router.get(
  '/',
  taskFilterValidation,
  validateRequest,
  taskController.getAllTasks
);

/**
 * POST /api/v1/tasks
 * All roles allowed — but User can only assign to self (enforced in service)
 */
router.post(
  '/',
  taskValidation.create,
  validateRequest,
  taskController.createTask
);

/**
 * GET /api/v1/tasks/:id
 * All roles — access-checked per role in service layer
 */
router.get(
  '/:id',
  taskController.getTaskById
);

/**
 * PUT /api/v1/tasks/:id
 * Admin + Manager only — further scoped in service
 */
router.put(
  '/:id',
  checkRole('admin', 'manager'),
  taskValidation.update,
  validateRequest,
  taskController.updateTask
);

/**
 * PATCH /api/v1/tasks/:id/status
 * All roles — but only on tasks they can access
 */
router.patch(
  '/:id/status',
  taskValidation.updateStatus,
  validateRequest,
  taskController.updateTaskStatus
);

/**
 * DELETE /api/v1/tasks/:id
 * Admin + Manager only — further scoped in service
 */
router.delete(
  '/:id',
  checkRole('admin', 'manager'),
  taskController.deleteTask
);

export default router;
/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management with full RBAC
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks (role-filtered — admin=all, manager=own+assigned, user=assigned)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, done] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *     responses:
 *       200:
 *         description: Paginated task list
 *       401:
 *         description: Not authenticated
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task (user role auto-assigns to self)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task by ID (RBAC — 403 if no access)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task returned
 *       403:
 *         description: No permission to access this task
 *       404:
 *         description: Task not found
 *   put:
 *     tags: [Tasks]
 *     summary: Full task update (admin=any, manager=own tasks only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       200:
 *         description: Task updated
 *       403:
 *         description: No permission to update this task
 *   delete:
 *     tags: [Tasks]
 *     summary: Soft delete task (admin=any, manager=own tasks only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 *       403:
 *         description: No permission
 */

/**
 * @swagger
 * /tasks/{id}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task status (all roles — on accessible tasks)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatusRequest'
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status value
 *       403:
 *         description: No permission
 */
