// frontend/src/components/kanban/KanbanColumn.tsx
import { useDroppable } from '@dnd-kit/core';
import { Plus, ClipboardList } from 'lucide-react';
import { Button } from '../ui/button';
import TaskCard from './TaskCard';
import EmptyState from '../shared/EmptyState';
import { cn } from '../../lib/utils';
import type { Task, TaskStatus } from '../../types';

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  canCreate: boolean;
  indicatorClass: string;
  onAdd: () => void;
  onEditTask: (task: Task) => void;
}

const KanbanColumn = ({
  status,
  label,
  tasks,
  canCreate,
  indicatorClass,
  onAdd,
  onEditTask,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col rounded-xl border overflow-hidden min-h-[480px]">
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <span
            className={cn('w-2 h-2 rounded-full flex-shrink-0', indicatorClass)}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <span className="min-w-[20px] text-center text-[11px] font-bold tabular-nums bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>

        {canCreate && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onAdd}
            aria-label={`Add task to ${label}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-3 space-y-2.5 bg-muted/20 dark:bg-muted/5 transition-colors duration-150',
          isOver && 'bg-primary/5'
        )}
      >
        {tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No tasks"
            description="Drop tasks here"
            className="py-10 text-xs"
          />
        ) : (
          tasks.map((task) => (
            <TaskCard key={task._id} task={task} onEdit={onEditTask} />
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
