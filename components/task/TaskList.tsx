'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTasks } from '@/hooks/useTasks';
import { useTaskDnd } from '@/hooks/useTaskDnd';
import { useProjectContext } from '@/context/ProjectContext';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { FilterBar } from './FilterBar';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/Button';
import { filterAndSortTasks, hasActiveFilters } from '@/utils/taskUtils';
import type { Task, TaskFormValues } from '@/types/task';

export function TaskList() {
  const {
    tasks: inboxTasks,
    filter,
    sort,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    setFilter,
    setSort,
    clearFilters,
  } = useTasks();

  const { state: projectState, updateModuleTask, deleteModuleTask } = useProjectContext();

  // Merge inbox tasks + all module tasks into one unified list
  const allTasks = useMemo(
    () => [...inboxTasks, ...projectState.moduleTasks],
    [inboxTasks, projectState.moduleTasks],
  );

  const filteredTasks = useMemo(
    () => filterAndSortTasks(allTasks, filter, sort),
    [allTasks, filter, sort],
  );

  const isFiltered = hasActiveFilters(filter);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragBlocked, setDragBlocked] = useState(false);

  // Only inbox tasks are reorderable from this view
  const { sensors } = useTaskDnd({ tasks: inboxTasks, onReorder: reorderTasks });

  const activeTask = activeId ? allTasks.find((t) => t.id === activeId) : null;

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string);
    setDragBlocked(false);
  }, []);

  const handleDragOver = useCallback(
    (e: DragOverEvent) => {
      const { active, over } = e;
      if (!over) return;
      const a = filteredTasks.find((t) => t.id === active.id);
      const o = filteredTasks.find((t) => t.id === over.id);
      if (a && o) setDragBlocked(a.priority !== o.priority);
    },
    [filteredTasks],
  );

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      setActiveId(null);
      setDragBlocked(false);
      if (!over || active.id === over.id) return;
      const dragged = inboxTasks.find((t) => t.id === active.id);
      const target = inboxTasks.find((t) => t.id === over.id);
      if (!dragged || !target || dragged.priority !== target.priority) {
        toast.error('Tasks can only be reordered within the same priority level.');
        return;
      }
      const oldIdx = inboxTasks.findIndex((t) => t.id === active.id);
      const newIdx = inboxTasks.findIndex((t) => t.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) reorderTasks(arrayMove(inboxTasks, oldIdx, newIdx));
    },
    [inboxTasks, reorderTasks],
  );

  const handleOpenCreate = () => {
    setEditingTask(undefined);
    setModalOpen(true);
  };
  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSubmit = (values: TaskFormValues) => {
    if (editingTask) {
      // Route update to correct store depending on whether task belongs to a module
      if (editingTask.moduleId) {
        updateModuleTask(editingTask.id, values);
      } else {
        updateTask(editingTask.id, values);
      }
      toast.success('Task updated');
    } else {
      addTask(values);
      toast.success('Task created');
    }
  };

  const handleDelete = (id: string) => {
    const task = allTasks.find((t) => t.id === id);
    if (task?.moduleId) {
      deleteModuleTask(id);
    } else {
      deleteTask(id);
    }
    toast.success(`"${task?.title ?? 'Task'}" deleted`);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar
          filter={filter}
          sort={sort}
          taskCount={allTasks.length}
          filteredCount={filteredTasks.length}
          onFilterChange={setFilter}
          onSortChange={setSort}
          onClearFilters={clearFilters}
        />
        <Button onClick={handleOpenCreate} size="sm" className="shrink-0">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {isFiltered && filteredTasks.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Drag-to-reorder is disabled while filters are active.
        </p>
      )}
      {!isFiltered && filteredTasks.length > 1 && (
        <p className="text-xs text-gray-400 dark:text-gray-600">
          You can drag tasks within the same priority level to reorder them.
        </p>
      )}

      {filteredTasks.length === 0 ? (
        <EmptyState
          isFiltered={isFiltered}
          onClearFilters={clearFilters}
          onCreateTask={handleOpenCreate}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3" role="list" aria-label="Task list">
              {filteredTasks.map((task) => (
                <div key={task.id} role="listitem">
                  <TaskCard
                    task={task}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    isDragDisabled={isFiltered || !!task.moduleId}
                  />
                </div>
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeTask && (
              <div className={dragBlocked ? 'opacity-40 grayscale' : ''}>
                <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} isDragDisabled />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <TaskForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        defaultValues={editingTask}
      />
    </div>
  );
}
