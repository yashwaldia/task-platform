// frontend/src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { QUERY_KEYS } from '../constants';
import type { User, PaginatedResponse } from '../types';

interface UserFilters {
  page?: number;
  limit?: number;
}

export const useUsers = (filters: UserFilters = {}) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  const usersQuery = useQuery({
    queryKey: [QUERY_KEYS.USERS, filters],
    queryFn: async (): Promise<PaginatedResponse<User>> => {
      const params = new URLSearchParams();
      if (filters.page)  params.append('page',  String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      const { data } = await api.get(`/users?${params.toString()}`);
      return data.data;
    },
    enabled: isAdmin,
    staleTime: 1000 * 60 * 5,
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, ...userData }: Partial<User> & { id: string }) => {
      const { data } = await api.put(`/users/${id}`, userData);
      return data.data as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
    },
  });

  return {
    users: usersQuery.data?.data ?? [],
    pagination: usersQuery.data?.pagination,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    updateUser,
    deleteUser,
  };
};
