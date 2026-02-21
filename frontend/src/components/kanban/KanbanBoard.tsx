// frontend/src/components/kanban/KanbanBoard.tsx
import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Search } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import type { Task, TaskStatus, TaskFilters } from '../../types';

const COLUMNS: {
  status: TaskStatus;
  label: string;
  indicatorClass: string;
}[] = [
  { status: 'todo',        label: 'To Do',       indicatorClass: 'bg-slate-400'  },
  { status: 'in_progress', label: 'In Progress', indicatorClass: 'bg-amber-400'  },
  { status: 'done',        label: 'Done',        indicatorClass: 'bg-emerald-500' },
];

interface KanbanBoardProps {
  filters?: TaskFilters;
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

const KanbanBoard = ({
  filters = {},
  onAddTask,
  onEditTask,
}: KanbanBoardProps) => {
  const user      = useAuthStore((s) => s.user);
  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  // Read the global search query set by Navbar
  const searchQuery = useUIStore((s) => s.searchQuery);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Fetch tasks from API (applies priority/status filters server-side)
  const { tasks, isLoading, updateTaskStatus } = useTasks(filters);

  // Apply client-side search on top of the already-fetched list.
  // Matches against title, description, and assignee name — case-insensitive.
  const q = searchQuery.trim().toLowerCase();
  const visibleTasks = q
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q) ?? false) ||
          (t.assignedTo?.name.toLowerCase().includes(q) ?? false),
      )
    : tasks;

  // Require 8 px movement before activating drag — prevents accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    // Look up in the full tasks list so drag always works regardless of search state
    const found = tasks.find((t) => t._id === active.id);
    setActiveTask(found ?? null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    if (!over) return;

    const taskId    = active.id as string;
    const newStatus = over.id  as TaskStatus;
    const task      = tasks.find((t) => t._id === taskId);

    if (!task || task.status === newStatus) return;

    updateTaskStatus.mutate({ id: taskId, status: newStatus });
  };

  if (isLoading) return <LoadingSkeleton variant="kanban" />;

  // Show a focused empty state when search is active but nothing matches
  const showSearchEmpty = q.length > 0 && visibleTasks.length === 0 && tasks.length > 0;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {showSearchEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No tasks found for &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try searching by title, description, or assignee name
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              label={col.label}
              indicatorClass={col.indicatorClass}
              tasks={visibleTasks.filter((t) => t.status === col.status)}
              canCreate={canCreate}
              onAdd={() => onAddTask(col.status)}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      )}

      {/* Drag overlay — ghost card rendered under cursor while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="rotate-1 scale-105 shadow-2xl opacity-90 pointer-events-none">
            <TaskCard task={activeTask} onEdit={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
