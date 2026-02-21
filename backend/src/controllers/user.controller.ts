import { Request, Response } from 'express';
import { userService }       from '../services/user.service';
import { HTTP_STATUS }       from '../constants';

// Typed route params — fixes "string | string[]" error from @types/express v5
type IdParam = { id: string };

/**
 * GET /api/v1/users
 * Admin only — paginated list of all active users
 */
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await userService.getAllUsers(req.query as any);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Users retrieved successfully',
    data:    result,
  });
};

/**
 * GET /api/v1/users/:id
 * Admin: any user | Non-admin: only themselves
 */
export const getUserById = async (
  req: Request<IdParam>,
  res: Response
): Promise<void> => {
  const user = await userService.getUserById(
    req.params.id,
    req.user!.userId,
    req.user!.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User retrieved successfully',
    data:    { user },
  });
};

/**
 * PUT /api/v1/users/:id
 * Admin: any user + role change | Others: own profile only, no role change
 */
export const updateUser = async (
  req: Request<IdParam>,
  res: Response
): Promise<void> => {
  const user = await userService.updateUser(
    req.params.id,
    req.body,
    req.user!.userId,
    req.user!.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User updated successfully',
    data:    { user },
  });
};

/**
 * DELETE /api/v1/users/:id
 * Admin only — soft delete
 */
export const deleteUser = async (
  req: Request<IdParam>,
  res: Response
): Promise<void> => {
  await userService.deleteUser(
    req.params.id,
    req.user!.userId
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User deleted successfully',
    data:    null,
  });
};
