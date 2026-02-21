// frontend/src/components/kanban/TaskModal.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import api from '../../lib/api';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/authStore';
import { taskSchema } from '../../validations/schemas';
import { QUERY_KEYS } from '../../constants';
import { cn } from '../../lib/utils';
import type { Task, TaskStatus, TaskPriority } from '../../types';

type TaskFormValues = z.infer<typeof taskSchema>;

type TaskPayload = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  dueDate?: string;
};

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaultStatus?: TaskStatus;
}

const TaskModal = ({ open, onClose, task, defaultStatus = 'todo' }: TaskModalProps) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canAssign = user?.role === 'admin';
  const canDelete = user?.role === 'admin' || user?.role === 'manager';
  const isEditMode = !!task;

  const { users } = useUsers();

  // Direct mutations — no redundant GET /tasks query
  const createTask = useMutation({
    mutationFn: async (payload: TaskPayload): Promise<Task> => {
      const { data } = await api.post('/tasks', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<TaskPayload>): Promise<Task> => {
      const { data } = await api.put(`/tasks/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema) });

  // Sync form state when modal opens
  useEffect(() => {
    if (!open) return;
    if (task) {
      reset({
        title:       task.title,
        description: task.description ?? '',
        status:      task.status,
        priority:    task.priority,
        assignedTo:
          task.assignedTo && typeof task.assignedTo === 'object'
            ? task.assignedTo._id
            : (task.assignedTo as string | undefined) ?? '',
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split('T')[0]
          : '',
      });
    } else {
      reset({
        title:       '',
        description: '',
        status:      defaultStatus,
        priority:    'medium',
        assignedTo:  '',
        dueDate:     '',
      });
    }
  }, [open, task, defaultStatus, reset]);

  const onSubmit = async (values: TaskFormValues) => {
    const payload: TaskPayload = {
      title:       values.title,
      description: values.description || undefined,
      status:      values.status as TaskStatus,
      priority:    values.priority as TaskPriority,
      assignedTo:  values.assignedTo || undefined,
      dueDate:     values.dueDate || undefined,
    };

    if (isEditMode && task) {
      await updateTask.mutateAsync({ id: task._id, ...payload });
    } else {
      await createTask.mutateAsync(payload);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!task) return;
    await deleteTask.mutateAsync(task._id);
    onClose();
  };

  const isPending = createTask.isPending || updateTask.isPending;
  const mutationError = createTask.error ?? updateTask.error;
  const serverError = mutationError
    ? ((mutationError as any)?.response?.data?.message ?? (mutationError as Error).message)
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1" noValidate>
          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
              {serverError}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="modal-title"
              placeholder="Task title"
              className={cn(errors.title && 'border-destructive')}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-desc">Description</Label>
            <textarea
              id="modal-desc"
              rows={3}
              placeholder="Optional description…"
              className={cn(
                'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                'placeholder:text-muted-foreground focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring resize-none',
                errors.description && 'border-destructive'
              )}
              {...register('description')}
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(v) =>
                  setValue('status', v as TaskStatus, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={watch('priority')}
                onValueChange={(v) =>
                  setValue('priority', v as TaskPriority, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assign To — admin only (only admin can GET /users) */}
          {canAssign && (
            <div className="space-y-1.5">
              <Label>Assign To</Label>
              <Select
                value={watch('assignedTo') ?? ''}
                onValueChange={(v) =>
                  setValue('assignedTo', v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name}{' '}
                      <span className="text-muted-foreground capitalize">
                        ({u.role})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-due">Due Date</Label>
            <Input
              id="modal-due"
              type="date"
              className={cn(errors.dueDate && 'border-destructive')}
              {...register('dueDate')}
            />
          </div>

          <DialogFooter className="gap-2 pt-2 flex-wrap">
            {/* Delete — edit mode + admin/manager only */}
            {isEditMode && canDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mr-auto gap-1.5"
                onClick={handleDelete}
                disabled={deleteTask.isPending}
              >
                {deleteTask.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  {isEditMode ? 'Saving…' : 'Creating…'}
                </>
              ) : isEditMode ? (
                'Save changes'
              ) : (
                'Create task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
