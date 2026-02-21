// frontend/src/hooks/useAuth.ts
import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { queryClient } from '../lib/queryClient';
import { ROUTES } from '../constants';
import type { User, AuthData } from '../types';

interface LoginCredentials  { email: string; password: string; }
interface SignupCredentials { name: string; email: string; password: string; }

export const useAuth = () => {
  const navigate        = useNavigate();
  const setAuth         = useAuthStore((s) => s.setAuth);
  const setAuthChecked  = useAuthStore((s) => s.setAuthChecked);
  const clearAuth       = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authChecked     = useAuthStore((s) => s.authChecked);
  const user            = useAuthStore((s) => s.user);

  // Silent re-auth on page refresh:
  // Step 1: POST /auth/refresh (sends httpOnly cookie) -> get new accessToken
  // Step 2: GET  /auth/me with new token -> restore user
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<User> => {
      // Restore token from httpOnly refresh cookie first
      let token: string | null = useAuthStore.getState().accessToken;
      if (!token) {
        const { data: refreshData } = await api.post('/auth/refresh');
        const newToken: string | undefined =
          refreshData.data?.accessToken ?? refreshData.accessToken;
        if (!newToken) throw new Error('No refresh token available');
        token = newToken;
        useAuthStore.getState().setToken(token);
      }
      // /auth/me response shape: { success, data: { user: {...} } }
      // We must return data.data.user (the User), not data.data (the wrapper)
      const { data } = await api.get('/auth/me');
      return data.data.user;
    },
    enabled:              !isAuthenticated && !authChecked,
    retry:                false,
    staleTime:            Infinity,
    gcTime:               Infinity,
    refetchOnMount:       false,
    refetchOnWindowFocus: false,
    refetchOnReconnect:   false,
    throwOnError:         false,
  });

  useEffect(() => {
    if (meQuery.data && !isAuthenticated) {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        setAuth(meQuery.data, token);
        connectSocket(token);
      } else {
        setAuthChecked();
      }
    }
  }, [meQuery.data, isAuthenticated, setAuth, setAuthChecked]);

  useEffect(() => {
    if (meQuery.isError) {
      setAuthChecked();
    }
  }, [meQuery.isError, setAuthChecked]);

  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data } = await api.post<{ success: boolean; data: AuthData }>(
        '/auth/login',
        credentials
      );
      return data.data;
    },
    onSuccess: (authData) => {
      setAuth(authData.user, authData.accessToken);
      connectSocket(authData.accessToken);
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
  });

  const signup = useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      const { data } = await api.post<{ success: boolean; data: AuthData }>(
        '/auth/signup',
        credentials
      );
      return data.data;
    },
    onSuccess: (authData) => {
      setAuth(authData.user, authData.accessToken);
      connectSocket(authData.accessToken);
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      clearAuth();
      disconnectSocket();
      queryClient.clear();
      navigate(ROUTES.LOGIN, { replace: true });
    },
  });

  const forgotPassword = useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data;
    },
  });

  return {
    user,
    isAuthenticated,
    isInitializing: !authChecked && meQuery.isLoading,
    login,
    signup,
    logout,
    forgotPassword,
  };
};
