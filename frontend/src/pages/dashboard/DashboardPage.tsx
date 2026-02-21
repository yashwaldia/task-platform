// frontend/src/pages/dashboard/DashboardPage.tsx
import {
  ClipboardList,
  Circle,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useAuthStore } from '../../store/authStore';
import StatsCard from '../../components/dashboard/StatsCard';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import EmptyState from '../../components/shared/EmptyState';
import { cn, formatDate } from '../../lib/utils';
import { PRIORITY_COLORS } from '../../constants';
import type { Task } from '../../types';

// Status dot colors used in the recent tasks list
const STATUS_DOT: Record<string, string> = {
  todo:        'bg-slate-400',
  in_progress: 'bg-amber-400',
  done:        'bg-emerald-500',
};

// ─── Recent task row (extracted to avoid anonymous components in map) ─────────
const RecentTaskRow = ({ task }: { task: Task }) => (
  <div className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors">
    {/* Status dot */}
    <span
      className={cn(
        'w-2 h-2 rounded-full flex-shrink-0',
        STATUS_DOT[task.status] ?? 'bg-slate-400'
      )}
      aria-hidden="true"
    />

    {/* Title + assignee */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
      {task.assignedTo && (
        <p className="text-xs text-muted-foreground truncate">
          {task.assignedTo.name}
        </p>
      )}
    </div>

    {/* Priority badge */}
    <span
      className={cn(
        'text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize',
        PRIORITY_COLORS[task.priority] ?? 'bg-gray-100 text-gray-600'
      )}
    >
      {task.priority}
    </span>

    {/* Date — hidden on small screens */}
    <span className="hidden sm:block text-xs text-muted-foreground flex-shrink-0 tabular-nums">
      {formatDate(task.createdAt)}
    </span>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);

  // Fetch all visible tasks (RBAC-filtered server-side).
  // High limit so stats are computed over all returned records.
  const { tasks, pagination, isLoading, isError } = useTasks({
    limit:  100,
    sortBy: 'createdAt',
    order:  'desc',
  });

  // Derived stats
  const todoCount       = tasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const doneCount       = tasks.filter((t) => t.status === 'done').length;
  const totalCount      = pagination?.total ?? tasks.length;

  const recentTasks = tasks.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
        <LoadingSkeleton variant="stats" />
        <LoadingSkeleton variant="table" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Welcome header ── */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Tasks"
          value={totalCount}
          icon={ClipboardList}
          description="All assigned tasks"
          iconBgClass="bg-primary/10"
          iconColorClass="text-primary"
        />
        <StatsCard
          title="To Do"
          value={todoCount}
          icon={Circle}
          description="Pending start"
          iconBgClass="bg-slate-100 dark:bg-slate-800"
          iconColorClass="text-slate-500 dark:text-slate-400"
        />
        <StatsCard
          title="In Progress"
          value={inProgressCount}
          icon={Timer}
          description="Currently active"
          iconBgClass="bg-amber-100 dark:bg-amber-950"
          iconColorClass="text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          title="Completed"
          value={doneCount}
          icon={CheckCircle2}
          description="Tasks finished"
          iconBgClass="bg-emerald-100 dark:bg-emerald-950"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* ── Recent tasks ── */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">
          Recent Tasks
        </h3>

        {isError ? (
          <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            Failed to load tasks — please refresh the page.
          </div>
        ) : recentTasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No tasks yet"
            description="Tasks assigned to you will appear here."
          />
        ) : (
          <div className="rounded-xl border bg-card divide-y divide-border overflow-hidden">
            {recentTasks.map((task) => (
              <RecentTaskRow key={task._id} task={task} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
