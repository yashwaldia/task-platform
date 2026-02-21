// frontend/src/hooks/useAuth.ts — REPLACE ENTIRE FILE
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
  const authChecked     = useAuthStore((s) => s.authChecked);   // ← key flag
  const user            = useAuthStore((s) => s.user);

  // ─── Silent re-auth ───────────────────────────────────────────────────────
  // Runs ONCE on app start when not authenticated.
  // authChecked flag ensures it NEVER runs again after the first attempt,
  // regardless of how many components call useAuth() or remount.
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<User> => {
      const { data } = await api.get('/auth/me');
      return data.data;
    },
    enabled:              !isAuthenticated && !authChecked,  // ← stops the loop
    retry:                false,
    staleTime:            Infinity,
    gcTime:               Infinity,
    refetchOnMount:       false,
    refetchOnWindowFocus: false,
    refetchOnReconnect:   false,
    throwOnError:         false,
  });

  // On success — sync user into store
  useEffect(() => {
    if (meQuery.data && !isAuthenticated) {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        setAuth(meQuery.data, token);
        connectSocket(token);
      } else {
        // /auth/me succeeded but no token in memory — shouldn't happen
        // but mark as checked to prevent looping
        setAuthChecked();
      }
    }
  }, [meQuery.data, isAuthenticated, setAuth, setAuthChecked]);

  // On failure — mark as checked so query never fires again
  useEffect(() => {
    if (meQuery.isError) {
      setAuthChecked();
    }
  }, [meQuery.isError, setAuthChecked]);

  // ─── Login ────────────────────────────────────────────────────────────────
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

  // ─── Signup ───────────────────────────────────────────────────────────────
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

  // ─── Logout ───────────────────────────────────────────────────────────────
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

  // ─── Forgot Password ──────────────────────────────────────────────────────
  const forgotPassword = useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data;
    },
  });

  return {
    user,
    isAuthenticated,
    // isInitializing is true ONLY during the very first /auth/me check
    isInitializing: !authChecked && meQuery.isLoading,
    login,
    signup,
    logout,
    forgotPassword,
  };
};
