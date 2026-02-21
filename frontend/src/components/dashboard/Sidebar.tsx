// frontend/src/components/dashboard/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CheckSquare,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants';
import { cn, getInitials } from '../../lib/utils';

interface SidebarProps {
  onNavigate?: () => void;
}

const BASE_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: ROUTES.DASHBOARD },
  { label: 'Tasks',     icon: ClipboardList,   href: ROUTES.TASKS },
];

const ADMIN_NAV = [
  { label: 'Users', icon: Users, href: ROUTES.USERS },
];

const ROLE_PILL: Record<string, string> = {
  admin:   'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  manager: 'bg-blue-100   text-blue-700   dark:bg-blue-950   dark:text-blue-300',
  user:    'bg-gray-100   text-gray-600   dark:bg-gray-800   dark:text-gray-300',
};

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const location = useLocation();
  const user     = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  const navItems = [
    ...BASE_NAV,
    ...(user?.role === 'admin' ? ADMIN_NAV : []),
  ];

  return (
    <div className="flex flex-col h-full select-none">

      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-5 h-16 flex-shrink-0 border-b">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary flex-shrink-0">
          <CheckSquare className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">TaskFlow</span>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <item.icon className="h-[1.05rem] w-[1.05rem] flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── User profile + logout ── */}
      <div className="flex-shrink-0 border-t p-3 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {user ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate leading-tight">
              {user?.name ?? 'User'}
            </p>
            <span
              className={cn(
                'inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize leading-tight mt-0.5',
                user?.role ? ROLE_PILL[user.role] : ROLE_PILL.user
              )}
            >
              {user?.role ?? 'user'}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
