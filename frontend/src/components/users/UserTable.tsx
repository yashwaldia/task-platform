// frontend/src/components/users/UserTable.tsx
import { useState } from 'react';
import { Pencil, Trash2, Loader2, ShieldCheck, Shield, UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Separator } from '../ui/separator';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/authStore';
import { getInitials, formatDate, cn } from '../../lib/utils';
import { ROLE_COLORS } from '../../constants';
import type { User } from '../../types';

const ROLE_ICON = {
  admin:   ShieldCheck,
  manager: Shield,
  user:    UserIcon,
} as const;

// ─── Single user row ──────────────────────────────────────────────────────────
interface UserRowProps {
  user: User;
  currentUserId: string;
  onEditRole: (user: User) => void;
  onDelete: (user: User) => void;
}

const UserRow = ({ user, currentUserId, onEditRole, onDelete }: UserRowProps) => {
  const Icon = ROLE_ICON[user.role] ?? UserIcon;
  const isSelf = user._id === currentUserId;

  return (
    <div className="flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-accent/40 transition-colors group">
      {/* Avatar */}
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">
            {user.name}
          </p>
          {isSelf && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
              You
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      {/* Role badge */}
      <span
        className={cn(
          'hidden sm:inline-flex items-center gap-1 text-xs font-semibold',
          'px-2 py-0.5 rounded-full capitalize flex-shrink-0',
          ROLE_COLORS[user.role] ?? ROLE_COLORS.user
        )}
      >
        <Icon className="h-3 w-3" />
        {user.role}
      </span>

      {/* Joined date */}
      <span className="hidden lg:block text-xs text-muted-foreground flex-shrink-0 tabular-nums">
        {formatDate(user.createdAt)}
      </span>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEditRole(user)}
          disabled={isSelf}
          aria-label={`Edit role for ${user.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(user)}
          disabled={isSelf}
          aria-label={`Delete ${user.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

// ─── Main table component ──────────────────────────────────────────────────────
const UserTable = () => {
  const currentUser = useAuthStore((s) => s.user);
  const { users, pagination, isLoading, isError, updateUser, deleteUser } =
    useUsers({ page: 1, limit: 20 });

  const [editingUser, setEditingUser]   = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role);
  };

  const handleConfirmEdit = async () => {
    if (!editingUser) return;
    await updateUser.mutateAsync({
      id:   editingUser._id,
      role: selectedRole as User['role'],
    });
    setEditingUser(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    await deleteUser.mutateAsync(deletingUser._id);
    setDeletingUser(null);
  };

  if (isError) {
    return (
      <div className="rounded-xl border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
        Failed to load users — please refresh.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0 animate-pulse"
          >
            <div className="h-9 w-9 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-44 rounded bg-muted" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted hidden sm:block" />
            <div className="h-7 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Table header row */}
      <div className="flex items-center gap-4 px-4 py-2 rounded-t-xl border border-b-0 bg-muted/40">
        <div className="w-9 flex-shrink-0" aria-hidden="true" />
        <p className="flex-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          User
        </p>
        <p className="hidden sm:block text-xs font-semibold uppercase tracking-wide text-muted-foreground w-20 text-center flex-shrink-0">
          Role
        </p>
        <p className="hidden lg:block text-xs font-semibold uppercase tracking-wide text-muted-foreground w-24 flex-shrink-0">
          Joined
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-16 text-right flex-shrink-0">
          Actions
        </p>
      </div>

      {/* Rows */}
      <div className="rounded-b-xl border bg-card divide-y divide-border overflow-hidden">
        {users.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            No users found.
          </div>
        ) : (
          users.map((u) => (
            <UserRow
              key={u._id}
              user={u}
              currentUserId={currentUser?._id ?? ''}
              onEditRole={handleEditRole}
              onDelete={setDeletingUser}
            />
          ))
        )}
      </div>

      {/* Pagination count */}
      {pagination && (
        <p className="text-xs text-muted-foreground text-right pt-2">
          Showing {users.length} of {pagination.total} member
          {pagination.total !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Edit role dialog ── */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(v) => !v && setEditingUser(null)}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <p className="text-sm text-muted-foreground">
              Update role for{' '}
              <span className="font-semibold text-foreground">
                {editingUser?.name}
              </span>
            </p>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmEdit}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm dialog ── */}
      <Dialog
        open={!!deletingUser}
        onOpenChange={(v) => !v && setDeletingUser(null)}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <Separator />
          <p className="text-sm text-muted-foreground py-1">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">
              {deletingUser?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingUser(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserTable;
