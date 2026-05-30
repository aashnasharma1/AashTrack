'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useDroppable,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, CircleDashed, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TaskListItem } from './TaskListItem';
import { useTaskContext } from '@/context/TaskContext';
import type { Collection, Status, Task, StatusGroup, TaskPatch } from '@/types/task';

// Default icons for the 3 built-in statuses
const DEFAULT_ICONS: Record<string, React.ElementType> = {
  todo: CircleDashed,
  'in-progress': Loader2,
  done: CheckCircle2,
};

// ── Sortable row wrapper ──────────────────────────────────────────────────────

interface RowProps {
  task: Task;
  collections?: Collection[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: TaskPatch) => void;
  onStatusChange: (id: string, status: Status) => void;
  onEdit?: (task: Task) => void;
}

function SortableTaskRow({ task, ...itemProps }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <TaskListItem
        task={task}
        dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>}
        {...itemProps}
      />
    </div>
  );
}

// ── Droppable group section ───────────────────────────────────────────────────

interface GroupProps {
  group: StatusGroup;
  tasks: Task[];
  collections: Collection[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: TaskPatch) => void;
  onStatusChange: (id: string, status: Status) => void;
  onEdit?: (task: Task) => void;
  onCreateTask?: () => void;
}

function DroppableGroup({
  group,
  tasks,
  collections,
  onDelete,
  onUpdate,
  onStatusChange,
  onEdit,
  onCreateTask,
}: GroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: group.id });
  const Icon = DEFAULT_ICONS[group.id] ?? CircleDashed;

  return (
    <section aria-label={group.label}>
      {/* Group header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        className="mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/60"
      >
        <span className="text-gray-400 dark:text-gray-600">
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
          style={{ backgroundColor: group.color }}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
          {group.label}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-600">{tasks.length}</span>
      </button>

      {!collapsed && (
        <div
          ref={setNodeRef}
          className={cn(
            'overflow-hidden rounded-xl border transition-colors',
            isOver && tasks.length === 0
              ? 'border-blue-300 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20'
              : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900',
          )}
          role="rowgroup"
        >
          {/* Column headers */}
          <div className="grid grid-cols-[20px_1fr_112px_52px_88px_56px] items-center gap-2 border-b border-gray-50 px-3 py-1.5 dark:border-gray-800">
            <span />
            <span className="text-xs font-medium text-gray-400 dark:text-gray-600">Name</span>
            <span className="text-xs font-medium text-gray-400 dark:text-gray-600">Schedule</span>
            <span className="text-center text-xs font-medium text-gray-400 dark:text-gray-600">
              Priority
            </span>
            <span className="text-xs font-medium text-gray-400 dark:text-gray-600">Status</span>
            <span />
          </div>

          {tasks.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <p className="text-xs text-gray-300 dark:text-gray-700">
                No tasks — drag one here or{' '}
                {onCreateTask ? (
                  <button
                    type="button"
                    onClick={onCreateTask}
                    className="underline underline-offset-2 transition-colors hover:text-gray-500 dark:hover:text-gray-400"
                  >
                    create a new one
                  </button>
                ) : (
                  'create a new one'
                )}
              </p>
            </div>
          ) : (
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  role="row"
                  className={cn(
                    idx < tasks.length - 1 && 'border-b border-gray-50 dark:border-gray-800/60',
                  )}
                >
                  <SortableTaskRow
                    task={task}
                    collections={collections}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    onStatusChange={onStatusChange}
                    onEdit={onEdit}
                  />
                </div>
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </section>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface TaskGroupedProps {
  tasks: Task[];
  collections: Collection[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: TaskPatch) => void;
  onStatusChange: (id: string, status: Status) => void;
  onEdit?: (task: Task) => void;
  onReorder?: (reordered: Task[]) => void;
  onCreateTask?: () => void;
}

export function TaskGrouped({
  tasks,
  collections,
  onDelete,
  onUpdate,
  onStatusChange,
  onEdit,
  onReorder,
  onCreateTask,
}: TaskGroupedProps) {
  const {
    state: { statusGroups },
  } = useTaskContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTask = activeId ? (tasks.find((t) => t.id === activeId) ?? null) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      setActiveId(null);
      if (!over || active.id === over.id) return;

      const draggedTask = tasks.find((t) => t.id === active.id);
      if (!draggedTask) return;

      const statusSet = new Set(statusGroups.map((g) => g.id));
      let targetStatus: Status;
      if (statusSet.has(over.id as string)) {
        targetStatus = over.id as Status;
      } else {
        const overTask = tasks.find((t) => t.id === over.id);
        if (!overTask) return;
        targetStatus = overTask.status;
      }

      if (draggedTask.status !== targetStatus) {
        onStatusChange(draggedTask.id, targetStatus);
      } else if (onReorder) {
        const groupTasks = tasks.filter((t) => t.status === targetStatus);
        const oldIdx = groupTasks.findIndex((t) => t.id === active.id);
        const newIdx = groupTasks.findIndex((t) => t.id === over.id);
        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;
        const reorderedGroup = arrayMove(groupTasks, oldIdx, newIdx);
        const otherTasks = tasks.filter((t) => t.status !== targetStatus);
        onReorder([...reorderedGroup, ...otherTasks]);
      }
    },
    [tasks, onStatusChange, onReorder, statusGroups],
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-3">
          {statusGroups.map((group) => (
            <DroppableGroup
              key={group.id}
              group={group}
              tasks={tasks.filter((t) => t.status === group.id)}
              collections={collections}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onCreateTask={onCreateTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
              <TaskListItem
                task={activeTask}
                onDelete={() => {}}
                onUpdate={() => {}}
                onStatusChange={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}
