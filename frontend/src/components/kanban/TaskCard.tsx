// frontend/src/components/kanban/TaskCard.tsx
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, Pencil } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn, formatDate, getInitials } from '../../lib/utils';
import { PRIORITY_COLORS } from '../../constants';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const TaskCard = ({ task, onEdit }: TaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: { task },
  });

  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-background border rounded-lg p-3.5 space-y-2.5 group cursor-default',
        'hover:shadow-sm transition-all duration-150',
        isDragging && 'opacity-40 shadow-lg ring-2 ring-primary/30'
      )}
    >
      {/* Header: drag handle + priority */}
      <div className="flex items-center justify-between gap-2">
        <button
          {...listeners}
          {...attributes}
          className="flex-shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag task"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span
          className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0',
            PRIORITY_COLORS[task.priority] ?? 'bg-gray-100 text-gray-600'
          )}
        >
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <p
        onClick={() => onEdit(task)}
        className="text-sm font-medium text-foreground leading-snug line-clamp-2 cursor-pointer hover:text-primary transition-colors"
      >
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer: assignee + due date + edit */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.assignedTo && (
            <Avatar className="h-5 w-5 flex-shrink-0">
              <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                {getInitials(
                  typeof task.assignedTo === 'object'
                    ? task.assignedTo.name
                    : 'U'
                )}
              </AvatarFallback>
            </Avatar>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground truncate">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        <button
          onClick={() => onEdit(task)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          aria-label={`Edit: ${task.title}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
