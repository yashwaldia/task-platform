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
import { useTasks } from '../../hooks/useTasks';
import { useAuthStore } from '../../store/authStore';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import type { Task, TaskStatus, TaskFilters } from '../../types';

const COLUMNS: {
  status: TaskStatus;
  label: string;
  indicatorClass: string;
}[] = [
  { status: 'todo',        label: 'To Do',       indicatorClass: 'bg-slate-400' },
  { status: 'in_progress', label: 'In Progress', indicatorClass: 'bg-amber-400' },
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
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { tasks, isLoading, updateTaskStatus } = useTasks(filters);

  // Require 8px movement before activating drag — prevents accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    const found = tasks.find((t) => t._id === active.id);
    setActiveTask(found ?? null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    if (!over) return;

    const taskId   = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task     = tasks.find((t) => t._id === taskId);

    if (!task || task.status === newStatus) return;

    updateTaskStatus.mutate({ id: taskId, status: newStatus });
  };

  if (isLoading) return <LoadingSkeleton variant="kanban" />;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            indicatorClass={col.indicatorClass}
            tasks={tasks.filter((t) => t.status === col.status)}
            canCreate={canCreate}
            onAdd={() => onAddTask(col.status)}
            onEditTask={onEditTask}
          />
        ))}
      </div>

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
