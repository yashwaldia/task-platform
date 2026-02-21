// frontend/src/components/dashboard/Navbar.tsx
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Search, LogOut, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import ThemeToggle from '../shared/ThemeToggle';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants';
import { getInitials } from '../../lib/utils';

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.TASKS]:     'Tasks',
  [ROUTES.USERS]:     'Users',
};

const Navbar = () => {
  const location = useLocation();
  const { toggleSidebar, searchQuery, setSearchQuery, clearSearch } = useUIStore();
  const user   = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef  = useRef<HTMLInputElement>(null);

  const pageTitle   = PAGE_TITLES[location.pathname] ?? 'TaskFlow';
  const isTasksPage = location.pathname === ROUTES.TASKS;

  // Auto-focus the input whenever the search bar opens
  useEffect(() => {
    if (!isSearchOpen) return;
    const timer = setTimeout(() => {
      desktopInputRef.current?.focus();
      mobileInputRef.current?.focus();
    }, 40);
    return () => clearTimeout(timer);
  }, [isSearchOpen]);

  // Close search and clear query whenever the user navigates to a different page
  useEffect(() => {
    setIsSearchOpen(false);
    clearSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleOpenSearch  = () => setIsSearchOpen(true);
  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    clearSearch();
  };

  return (
    <header className="border-b bg-card flex-shrink-0">

      {/* ── Main header row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">

        {/* Left: hamburger (mobile) + page title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">

          {/* ── Search (Tasks page only) ── */}
          {isTasksPage && (
            <>
              {/* Desktop: inline expanding input */}
              {isSearchOpen ? (
                <div className="hidden sm:flex items-center gap-2 bg-accent/60 border border-border rounded-lg px-3 h-9 w-48 xl:w-72 transition-all">
                  <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <input
                    ref={desktopInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="flex-1 min-w-0 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                    aria-label="Search tasks"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Clear search text"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleCloseSearch}
                    className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                    aria-label="Close search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex text-muted-foreground hover:text-foreground"
                  onClick={handleOpenSearch}
                  aria-label="Search tasks"
                >
                  <Search className="h-[1.05rem] w-[1.05rem]" />
                </Button>
              )}

              {/* Mobile: icon button that reveals the row below */}
              {!isSearchOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden text-muted-foreground hover:text-foreground"
                  onClick={handleOpenSearch}
                  aria-label="Search tasks"
                >
                  <Search className="h-[1.05rem] w-[1.05rem]" />
                </Button>
              )}
            </>
          )}

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-[1.05rem] w-[1.05rem]" />
            <span
              className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
          </Button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-accent"
                aria-label="User menu"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {user ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                  {user?.name ?? 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="font-semibold text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {user?.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut className="h-4 w-4" />
                {logout.isPending ? 'Signing out…' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Mobile search row (slides in below the header on small screens) ── */}
      {isTasksPage && isSearchOpen && (
        <div className="sm:hidden border-t border-border px-4 py-2.5 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={mobileInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 min-w-0 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            aria-label="Search tasks"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleCloseSearch}
            className="text-sm font-medium text-muted-foreground hover:text-foreground ml-1 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

    </header>
  );
};

export default Navbar;
