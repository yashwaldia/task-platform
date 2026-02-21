import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { verifyToken }     from '../middleware/verifyToken';
import { checkRole }       from '../middleware/checkRole';
import { validateRequest } from '../middleware/validateRequest';
import { userValidation, paginationValidation } from '../validations/schemas';


const router = Router();


// All user routes require a valid access token
router.use(verifyToken);


/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (admin only)
 *     description: Returns paginated list of all non-deleted users. Supports filtering by role.
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, manager, user] }
 *         description: Filter users by role
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, example: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:    { type: array, items: { $ref: '#/components/schemas/User' } }
 *                     total:      { type: integer }
 *                     page:       { type: integer }
 *                     totalPages: { type: integer }
 *       403:
 *         description: Admin access required
 */
router.get(
  '/',
  checkRole('admin'),
  paginationValidation,
  validateRequest,
  userController.getAllUsers
);


/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: |
 *       - **admin** — can view any user
 *       - **manager / user** — can only view their own profile
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ObjectId
 *     responses:
 *       200:
 *         description: User returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Invalid user ID format
 *       403:
 *         description: Cannot view another user's profile
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  userValidation.idParam,
  validateRequest,
  userController.getUserById
);


/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile or role
 *     description: |
 *       - **admin** — can update any user's name and role
 *       - **manager / user** — can only update their own name; role change blocked
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: 'Jane Updated' }
 *               role: { type: string, enum: [admin, manager, user], description: 'Admin only' }
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Invalid user ID format
 *       403:
 *         description: Cannot update another user or change role without admin rights
 *       404:
 *         description: User not found
 */
router.put(
  '/:id',
  userValidation.idParam,
  userValidation.update,
  validateRequest,
  userController.updateUser
);


/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Soft delete a user (admin only)
 *     description: |
 *       Sets `deletedAt` timestamp. Self-deletion is blocked — admin cannot delete their own account.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User soft-deleted successfully
 *       400:
 *         description: Cannot delete your own account
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.delete(
  '/:id',
  checkRole('admin'),
  userValidation.idParam,
  validateRequest,
  userController.deleteUser
);


/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management — admin-scoped CRUD with role control
 */
export default router;
