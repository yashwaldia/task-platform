// frontend/src/pages/dashboard/TasksPage.tsx
import { useState } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import TaskModal from '../../components/kanban/TaskModal';
import { useAuthStore } from '../../store/authStore';
import type { Task, TaskFilters, TaskPriority, TaskStatus } from '../../types';

const TasksPage = () => {
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  // Filter state
  const [filters, setFilters] = useState<TaskFilters>({});

  // Single modal instance — owned by the page, passed down via callbacks
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingTask, setEditingTask]   = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');

  const handleAddTask = (status: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDefaultStatus(task.status);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(null);
  };

  const handlePriorityFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      priority: value === 'all' ? undefined : (value as TaskPriority),
    }));
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tasks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Drag cards between columns to update status in real time
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority filter */}
          <Select onValueChange={handlePriorityFilter} defaultValue="all">
            <SelectTrigger className="h-9 w-[145px] text-sm gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          {/* New task button — admin/manager only */}
          {canCreate && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => handleAddTask('todo')}
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* ── Kanban board ── */}
      <KanbanBoard
        filters={filters}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
      />

      {/* ── Single shared task modal ── */}
      <TaskModal
        open={modalOpen}
        onClose={handleCloseModal}
        task={editingTask}
        defaultStatus={defaultStatus}
      />
    </div>
  );
};

export default TasksPage;
