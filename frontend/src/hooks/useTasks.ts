// frontend/src/hooks/useTasks.ts — REPLACE ENTIRE FILE
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import { QUERY_KEYS, SOCKET_EVENTS } from '../constants';
import type { Task, TaskFilters, TaskStatus, TaskPriority, PaginatedResponse } from '../types';

// Explicit payload types — avoids Partial<Task> looseness
export type CreateTaskPayload = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  dueDate?: string;
};

export type UpdateTaskPayload = { id: string } & Partial<CreateTaskPayload>;

export const useTasks = (filters: TaskFilters = {}) => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const tasksQuery = useQuery({
    queryKey: [QUERY_KEYS.TASKS, filters],
    queryFn: async (): Promise<PaginatedResponse<Task>> => {
      const params = new URLSearchParams();
      if (filters.status)   params.append('status',   filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.page)     params.append('page',     String(filters.page));
      if (filters.limit)    params.append('limit',    String(filters.limit));
      if (filters.sortBy)   params.append('sortBy',   filters.sortBy);
      if (filters.order)    params.append('order',    filters.order);
      const { data } = await api.get(`/tasks?${params.toString()}`);
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });

  // ─── Create ───────────────────────────────────────────────────────────────
  const createTask = useMutation({
    mutationFn: async (payload: CreateTaskPayload): Promise<Task> => {
      const { data } = await api.post('/tasks', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
    },
  });

  // ─── Update ───────────────────────────────────────────────────────────────
  const updateTask = useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTaskPayload): Promise<Task> => {
      const { data } = await api.put(`/tasks/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
    },
  });

  // ─── Status update with optimistic update for smooth drag ─────────────────
  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }): Promise<Task> => {
      const { data } = await api.patch(`/tasks/${id}/status`, { status });
      return data.data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.TASKS] });
      const previousData = queryClient.getQueryData<PaginatedResponse<Task>>([
        QUERY_KEYS.TASKS,
        filters,
      ]);
      if (previousData) {
        queryClient.setQueryData([QUERY_KEYS.TASKS, filters], {
          ...previousData,
          data: previousData.data.map((t) =>
            t._id === id ? { ...t, status } : t
          ),
        });
      }
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([QUERY_KEYS.TASKS, filters], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
    },
  });

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteTask = useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
    },
  });

  // ─── Real-time sync ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
    };

    socket.on(SOCKET_EVENTS.TASK_CREATED,        invalidateAll);
    socket.on(SOCKET_EVENTS.TASK_UPDATED,        invalidateAll);
    socket.on(SOCKET_EVENTS.TASK_DELETED,        invalidateAll);
    socket.on(SOCKET_EVENTS.TASK_STATUS_CHANGED, invalidateAll);

    return () => {
      socket.off(SOCKET_EVENTS.TASK_CREATED,        invalidateAll);
      socket.off(SOCKET_EVENTS.TASK_UPDATED,        invalidateAll);
      socket.off(SOCKET_EVENTS.TASK_DELETED,        invalidateAll);
      socket.off(SOCKET_EVENTS.TASK_STATUS_CHANGED, invalidateAll);
    };
  }, [isAuthenticated, queryClient]);

  return {
    tasks:           tasksQuery.data?.data ?? [],
    pagination:      tasksQuery.data?.pagination,
    isLoading:       tasksQuery.isLoading,
    isError:         tasksQuery.isError,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  };
};
