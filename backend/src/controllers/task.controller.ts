import { Request, Response } from 'express';
import { taskService }       from '../services/task.service';
import { HTTP_STATUS }       from '../constants';

// Typed route params — fixes "string | string[]" error from @types/express v5
type IdParam = { id: string };

/**
 * GET /api/v1/tasks
 * Role-filtered: Admin=all, Manager=own+assigned, User=assigned only
 */
export const getAllTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await taskService.getAllTasks(
    req.query as any,
    req.user!.userId,
    req.user!.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Tasks retrieved successfully',
    data:    result,
  });
};

/**
 * POST /api/v1/tasks
 * Admin/Manager: assign to anyone | User: assign to self only
 */
export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const task = await taskService.createTask(
    req.body,
    req.user!.userId,
    req.user!.role
  );

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Task created successfully',
    data:    { task },
  });
};

/**
 * GET /api/v1/tasks/:id
 * Role-permission-checked access
 */
export const getTaskById = async (
  req: Request<IdParam>,
  res: Response
): Promise<void> => {
  const task = await taskService.getTaskById(
    req.params.id,
    req.user!.userId,
    req.user!.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Task retrieved successfully',
    data:    { task },
  });
};

/**
 * PUT /api/v1/tasks/:id
 * Admin: any task | Manager: only tasks they created
 */
export const updateTask = async (
  req: Request<IdParam>,
  res: Response
): Promise<void> => {
  const task = await taskService.updateTask(
    req.params.id,
    req.body,
    req.user!.userId,
    req.user!.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Task updated successfully',
    data:    { task },
  });
};

/**
 * PATCH /api/v1/tasks/:id/status
 * All roles — on tasks they have permission to access
 */
export const updateTaskStatus = async (
  req: Request<IdParam>,
  res: Response
): Promise<void> => {
  const task = await taskService.updateTaskStatus(
    req.params.id,
    req.body.status,
    req.user!.userId,
    req.user!.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Task status updated successfully',
    data:    { task },
  });
};

/**
 * DELETE /api/v1/tasks/:id
 * Admin: any task | Manager: only tasks they created
 */
export const deleteTask = async (
  req: Request<IdParam>,
  res: Response
): Promise<void> => {
  await taskService.deleteTask(
    req.params.id,
    req.user!.userId,
    req.user!.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Task deleted successfully',
    data:    null,
  });
};
