'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTasks } from '@/hooks/useTasks';
import { useTaskDnd } from '@/hooks/useTaskDnd';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { FilterBar } from './FilterBar';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/Button';
import type { Task, TaskFormValues } from '@/types/task';

export function TaskList() {
  const {
    tasks,
    filteredTasks,
    filter,
    sort,
    isFiltered,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    setFilter,
    setSort,
    clearFilters,
  } = useTasks();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { sensors } = useTaskDnd({
    tasks: filteredTasks,
    onReorder: reorderTasks,
  });

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || active.id === over.id) return;
      const oldIndex = filteredTasks.findIndex((t) => t.id === active.id);
      const newIndex = filteredTasks.findIndex((t) => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderTasks(arrayMove(filteredTasks, oldIndex, newIndex));
      }
    },
    [filteredTasks, reorderTasks],
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
      updateTask(editingTask.id, values);
      toast.success('Task updated');
    } else {
      addTask(values);
      toast.success('Task created');
    }
  };

  const handleDelete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    deleteTask(id);
    toast.success(`"${task?.title ?? 'Task'}" deleted`);
  };

  const isDragDisabled = isFiltered;

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar
          filter={filter}
          sort={sort}
          taskCount={tasks.length}
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

      {/* DnD hint when filters active */}
      {isFiltered && filteredTasks.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Drag to reorder is disabled while filters are active.
        </p>
      )}

      {/* Task list */}
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
                    isDragDisabled={isDragDisabled}
                  />
                </div>
              ))}
            </div>
          </SortableContext>

          {/* Ghost card while dragging */}
          <DragOverlay>
            {activeTask && (
              <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} isDragDisabled />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Task form modal */}
      <TaskForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        defaultValues={editingTask}
      />
    </div>
  );
}
