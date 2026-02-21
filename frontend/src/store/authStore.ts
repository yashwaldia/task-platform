// frontend/src/store/authStore.ts — REPLACE ENTIRE FILE
import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user:         User | null;
  accessToken:  string | null;
  isAuthenticated: boolean;
  authChecked:  boolean;           // ← NEW: true after first /auth/me attempt

  setAuth:      (user: User, token: string) => void;
  setToken:     (token: string) => void;
  setAuthChecked: () => void;      // ← NEW
  logout:       () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  accessToken:     null,
  isAuthenticated: false,
  authChecked:     false,

  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true, authChecked: true }),

  setToken: (accessToken) =>
    set({ accessToken }),

  setAuthChecked: () =>
    set({ authChecked: true }),

  logout: () =>
    set({
      user:            null,
      accessToken:     null,
      isAuthenticated: false,
      // authChecked stays true — don't re-run /auth/me after logout
    }),
}));
