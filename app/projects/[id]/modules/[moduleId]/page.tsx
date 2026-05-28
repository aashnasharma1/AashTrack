'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ChevronRight, LayoutList, LayoutGrid, ArrowLeft } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { useProjectContext } from '@/context/ProjectContext';
import { TaskTable } from '@/components/task/TaskTable';
import { TaskCard } from '@/components/task/TaskCard';
import { TaskForm } from '@/components/task/TaskForm';
import { FilterBar } from '@/components/task/FilterBar';
import { EmptyState } from '@/components/task/EmptyState';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { filterAndSortTasks, hasActiveFilters } from '@/utils/taskUtils';
import type { Task, TaskFormValues, FilterState, SortState } from '@/types/task';

type ViewMode = 'table' | 'cards';

export default function ModuleDetailPage() {
  const { id: projectId, moduleId } = useParams<{ id: string; moduleId: string }>();
  const router = useRouter();
  const {
    getProject,
    getModule,
    getTasksForModule,
    addModuleTask,
    updateModuleTask,
    deleteModuleTask,
    reorderModuleTasks,
  } = useProjectContext();

  const project = getProject(projectId);
  const mod = getModule(moduleId);
  const rawTasks = getTasksForModule(moduleId);

  // ── local UI state ──────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filter, setFilter] = useState<FilterState>({ status: '', priority: '' });
  const [sort, setSort] = useState<SortState>({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [activeId, setActiveId] = useState<string | null>(null);

  // ── derived ─────────────────────────────────────────────────────────────────
  const isFiltered = hasActiveFilters(filter);
  const displayTasks = filterAndSortTasks(rawTasks, filter, sort);
  const activeTask = activeId ? rawTasks.find((t) => t.id === activeId) : null;

  // ── DnD sensors ─────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const oldIdx = displayTasks.findIndex((t) => t.id === active.id);
      const newIdx = displayTasks.findIndex((t) => t.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        reorderModuleTasks(moduleId, arrayMove(displayTasks, oldIdx, newIdx));
      }
    },
    [displayTasks, moduleId, reorderModuleTasks],
  );

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleSubmit = (values: TaskFormValues) => {
    if (editingTask) {
      updateModuleTask(editingTask.id, values);
      toast.success('Task updated');
    } else {
      addModuleTask(moduleId, values);
      toast.success('Task created');
    }
  };

  const handleDelete = (id: string) => {
    const task = rawTasks.find((t) => t.id === id);
    deleteModuleTask(id);
    toast.success(`"${task?.title ?? 'Task'}" deleted`);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
  };

  const openCreate = () => {
    setEditingTask(undefined);
    setTaskFormOpen(true);
  };

  // ── not found guard ──────────────────────────────────────────────────────────
  if (!project || !mod) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Module not found.</p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => router.push(`/projects/${projectId}`)}
        >
          <ArrowLeft className="h-4 w-4" /> Back to project
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600"
      >
        <Link href="/projects" className="hover:text-gray-600 dark:hover:text-gray-300">
          Projects
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/projects/${projectId}`}
          className="hover:text-gray-600 dark:hover:text-gray-300"
        >
          {project.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-700 dark:text-gray-300">{mod.name}</span>
      </nav>

      {/* Module header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{mod.name}</h1>
        {mod.description && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{mod.description}</p>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar
          filter={filter}
          sort={sort}
          taskCount={rawTasks.length}
          filteredCount={displayTasks.length}
          onFilterChange={(f) => setFilter((prev) => ({ ...prev, ...f }))}
          onSortChange={(s) => setSort((prev) => ({ ...prev, ...s }))}
          onClearFilters={() => setFilter({ status: '', priority: '' })}
        />

        <div className="flex shrink-0 items-center gap-2">
          {/* View toggle */}
          <div
            className="flex rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900"
            role="group"
            aria-label="Switch view"
          >
            <button
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800',
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              aria-label="Card view"
              aria-pressed={viewMode === 'cards'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      {/* DnD disabled hint while filters active */}
      {isFiltered && displayTasks.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Drag-to-reorder is disabled while filters are active.
        </p>
      )}

      {/* Content */}
      {displayTasks.length === 0 ? (
        <EmptyState
          isFiltered={isFiltered}
          onClearFilters={() => setFilter({ status: '', priority: '' })}
          onCreateTask={openCreate}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {viewMode === 'table' ? (
              <TaskTable tasks={displayTasks} onEdit={openEdit} onDelete={handleDelete} />
            ) : (
              <div className="flex flex-col gap-3" role="list" aria-label="Task cards">
                {displayTasks.map((task) => (
                  <div key={task.id} role="listitem">
                    <TaskCard
                      task={task}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      isDragDisabled={isFiltered}
                    />
                  </div>
                ))}
              </div>
            )}
          </SortableContext>

          {/* Ghost while dragging */}
          <DragOverlay>
            {activeTask && viewMode === 'table' && (
              <table className="min-w-full">
                <tbody>
                  <TaskTable tasks={[activeTask]} onEdit={() => {}} onDelete={() => {}} />
                </tbody>
              </table>
            )}
            {activeTask && viewMode === 'cards' && (
              <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} isDragDisabled />
            )}
          </DragOverlay>
        </DndContext>
      )}

      <TaskForm
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        onSubmit={handleSubmit}
        defaultValues={editingTask}
      />
    </div>
  );
}
