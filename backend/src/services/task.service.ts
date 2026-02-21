import mongoose from 'mongoose';
import Task, { ITask } from '../models/Task.model';
import User           from '../models/User.model';
import { AppError }   from '../utils/AppError';
import { paginate, PaginationQuery, PaginatedResult } from '../utils/paginate';
import { emitToUserAndAdmins } from '../socket/taskGateway';


// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  title:        string;
  description?: string;
  status?:      string;
  priority?:    string;
  assignedTo:   string;
  dueDate?:     string | null;
}

export interface UpdateTaskInput {
  title?:       string;
  description?: string;
  status?:      string;
  priority?:    string;
  assignedTo?:  string;
  dueDate?:     string | null;
}

export interface TaskListQuery extends PaginationQuery {
  status?:     string;
  priority?:   string;
  assignedTo?: string;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildTaskFilter = (
  requesterRole: string,
  requesterId:   string,
  query:         TaskListQuery
): Record<string, any> => {
  const filter: Record<string, any> = {};

  if (requesterRole === 'admin') {
    if (query.assignedTo) {
      filter['assignedTo'] = new mongoose.Types.ObjectId(query.assignedTo);
    }
  } else if (requesterRole === 'manager') {
    filter['$or'] = [
      { createdBy:  new mongoose.Types.ObjectId(requesterId) },
      { assignedTo: new mongoose.Types.ObjectId(requesterId) },
    ];
  } else {
    filter['assignedTo'] = new mongoose.Types.ObjectId(requesterId);
  }

  if (query.status)   filter['status']   = query.status;
  if (query.priority) filter['priority'] = query.priority;

  return filter;
};


/**
 * Resolve an ObjectId reference to a plain string ID.
 * Handles both raw ObjectId (unpopulated) and populated User objects.
 * Without this, String(populatedObject) → "[object Object]" breaking RBAC checks.
 */
const resolveId = (ref: any): string =>
  ref?._id ? String(ref._id) : String(ref);


const canAccessTask = (
  task:          ITask,
  requesterId:   string,
  requesterRole: string
): boolean => {
  if (requesterRole === 'admin') return true;

  if (requesterRole === 'manager') {
    return (
      resolveId(task.createdBy)  === requesterId ||
      resolveId(task.assignedTo) === requesterId
    );
  }

  return resolveId(task.assignedTo) === requesterId;
};


// ─── Task Service ─────────────────────────────────────────────────────────────

class TaskService {

  async getAllTasks(
    query:         TaskListQuery,
    requesterId:   string,
    requesterRole: string
  ): Promise<PaginatedResult<ITask>> {
    const filter = buildTaskFilter(requesterRole, requesterId, query);
    return paginate(Task, filter, query, ['assignedTo', 'createdBy']);
  }


  async createTask(
    data:          CreateTaskInput,
    requesterId:   string,
    requesterRole: string
  ): Promise<ITask> {
    // User role: always force self-assignment regardless of body content
    if (requesterRole === 'user') {
      data.assignedTo = requesterId;
    }

    if (!mongoose.Types.ObjectId.isValid(data.assignedTo)) {
      throw new AppError('Invalid assignedTo user ID', 400);
    }

    const assignedUser = await User.findById(data.assignedTo);
    if (!assignedUser) {
      throw new AppError('The user you are assigning this task to does not exist', 404);
    }

    const task = await Task.create({
      ...data,
      createdBy: new mongoose.Types.ObjectId(requesterId),
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy',  'name email role');

    if (!populated) throw new AppError('Task creation failed', 500);

    emitToUserAndAdmins(String(task.assignedTo), 'task:created', populated);

    return populated;
  }


  async getTaskById(
    taskId:        string,
    requesterId:   string,
    requesterRole: string
  ): Promise<ITask> {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new AppError('Invalid task ID format', 400);
    }

    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email role')
      .populate('createdBy',  'name email role');

    if (!task) throw new AppError('Task not found', 404);

    if (!canAccessTask(task, requesterId, requesterRole)) {
      throw new AppError('You do not have permission to access this task', 403);
    }

    return task;
  }


  async updateTask(
    taskId:        string,
    data:          UpdateTaskInput,
    requesterId:   string,
    requesterRole: string
  ): Promise<ITask> {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new AppError('Invalid task ID format', 400);
    }

    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404);

    if (requesterRole === 'manager' && String(task.createdBy) !== requesterId) {
      throw new AppError('Managers can only update tasks they created', 403);
    }

    if (data.assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(data.assignedTo)) {
        throw new AppError('Invalid assignedTo user ID', 400);
      }
      const assignedUser = await User.findById(data.assignedTo);
      if (!assignedUser) {
        throw new AppError('Assigned user does not exist', 404);
      }
    }

    const updated = await Task.findByIdAndUpdate(
      taskId,
      { $set: data },
      { returnDocument: 'after', runValidators: true } // ← FIXED: was { new: true }
    )
      .populate('assignedTo', 'name email role')
      .populate('createdBy',  'name email role');

    if (!updated) throw new AppError('Task not found', 404);

    emitToUserAndAdmins(String(updated.assignedTo), 'task:updated', updated);

    return updated;
  }


  async updateTaskStatus(
    taskId:        string,
    status:        string,
    requesterId:   string,
    requesterRole: string
  ): Promise<ITask> {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new AppError('Invalid task ID format', 400);
    }

    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404);

    if (!canAccessTask(task, requesterId, requesterRole)) {
      throw new AppError('You do not have permission to update this task', 403);
    }

    const updated = await Task.findByIdAndUpdate(
      taskId,
      { $set: { status } },
      { returnDocument: 'after', runValidators: true } // ← FIXED: was { new: true }
    )
      .populate('assignedTo', 'name email role')
      .populate('createdBy',  'name email role');

    if (!updated) throw new AppError('Task not found', 404);

    emitToUserAndAdmins(String(updated.assignedTo), 'task:status_changed', updated);

    return updated;
  }


  async deleteTask(
    taskId:        string,
    requesterId:   string,
    requesterRole: string
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new AppError('Invalid task ID format', 400);
    }

    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404);

    if (requesterRole === 'manager' && String(task.createdBy) !== requesterId) {
      throw new AppError('Managers can only delete tasks they created', 403);
    }

    await Task.findByIdAndUpdate(taskId, { $set: { deletedAt: new Date() } });
    // ↑ no options object → no deprecation warning, no change needed

    emitToUserAndAdmins(String(task.assignedTo), 'task:deleted', { taskId });
  }
}


export const taskService = new TaskService();
