// frontend/src/store/uiStore.ts
import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface UIState {
  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Global search (used by Navbar → KanbanBoard)
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  clearSearch: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // ── Theme ────────────────────────────────────────────────────────────────────
  theme: (localStorage.getItem('theme') as Theme) ?? 'light',

  toggleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
    set({ theme: next });
  },

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ── Search ───────────────────────────────────────────────────────────────────
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  clearSearch: () => set({ searchQuery: '' }),
}));
