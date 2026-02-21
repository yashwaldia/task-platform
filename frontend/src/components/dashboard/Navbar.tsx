// frontend/src/components/dashboard/Navbar.tsx
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Search, LogOut } from 'lucide-react';
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
  const location          = useLocation();
  const { toggleSidebar } = useUIStore();
  const user              = useAuthStore((s) => s.user);
  const { logout }        = useAuth();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'TaskFlow';

  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 border-b bg-card flex-shrink-0">

      {/* ── Left: hamburger (mobile) + page title ── */}
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

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-1">

        {/* Search hint button — desktop only */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex text-muted-foreground hover:text-foreground"
          aria-label="Search"
        >
          <Search className="h-[1.05rem] w-[1.05rem]" />
        </Button>

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
          {/* Unread indicator dot */}
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
    </header>
  );
};

export default Navbar;
