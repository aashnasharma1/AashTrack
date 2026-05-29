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
} from '@dnd-kit/sortable';
import { Plus, CircleDashed, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TaskBoardCard } from './TaskBoardCard';
import { useTaskContext } from '@/context/TaskContext';
import type { Collection, Priority, Status, Task, StatusGroup } from '@/types/task';

type TaskPatch = { title?: string; priority?: Priority; startTime?: string; endTime?: string };

// Default icons for built-in statuses
const DEFAULT_ICONS: Record<string, React.ElementType> = {
  todo: CircleDashed,
  'in-progress': Loader2,
  done: CheckCircle2,
};

// ── Droppable column ──────────────────────────────────────────────────────────

function DroppableColumn({
  group,
  colTasks,
  allCollections,
  onDelete,
  onUpdate,
  onStatusChange,
  onCreateTask,
  className,
}: {
  group: StatusGroup;
  colTasks: Task[];
  allCollections: Collection[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: TaskPatch) => void;
  onStatusChange: (id: string, status: Status) => void;
  onCreateTask: () => void;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });
  const Icon = DEFAULT_ICONS[group.id] ?? CircleDashed;

  // Derive light versions of the group color for column bg/ring
  const bgStyle: React.CSSProperties = {
    backgroundColor: `${group.color}0d`,
    borderColor: isOver ? group.color : `${group.color}30`,
  };

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border transition-all duration-150',
        isOver && 'ring-2',
        className,
      )}
      style={{
        ...bgStyle,
        ...(isOver ? ({ '--tw-ring-color': group.color } as React.CSSProperties) : {}),
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: group.color }}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {group.label}
          </span>
          <span className="text-sm font-medium text-gray-400 dark:text-gray-600">
            {colTasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onCreateTask}
          aria-label={`Add task to ${group.label}`}
          title={`Add task to ${group.label}`}
          className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/60 hover:text-gray-600 dark:hover:bg-gray-800/60 dark:hover:text-gray-300"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Droppable card area */}
      <div
        ref={setNodeRef}
        className="flex min-h-[80px] flex-col gap-2 overflow-y-auto px-3 pb-2"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
        role="list"
        aria-label={`${group.label} tasks`}
      >
        <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {colTasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-6">
              <p className="text-xs text-gray-400/60 dark:text-gray-600">Drop tasks here</p>
            </div>
          ) : (
            colTasks.map((task) => (
              <div key={task.id} role="listitem">
                <TaskBoardCard
                  task={task}
                  collections={allCollections}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onStatusChange={onStatusChange}
                  isDragDisabled={false}
                />
              </div>
            ))
          )}
        </SortableContext>
      </div>

      {/* Footer: add task */}
      <button
        type="button"
        onClick={onCreateTask}
        className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors"
        style={{ color: group.color }}
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        Add Task
      </button>
    </div>
  );
}

// ── Board ─────────────────────────────────────────────────────────────────────

interface TaskBoardProps {
  tasks: Task[];
  collections: Collection[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: TaskPatch) => void;
  onStatusChange: (id: string, status: Status) => void;
  onCreateTask: () => void;
}

export function TaskBoard({
  tasks,
  collections,
  onDelete,
  onUpdate,
  onStatusChange,
  onCreateTask,
}: TaskBoardProps) {
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
      if (!over) return;
      const dragged = tasks.find((t) => t.id === active.id);
      if (!dragged) return;
      const statusSet = new Set(statusGroups.map((g) => g.id));
      let targetStatus: Status;
      if (statusSet.has(over.id as string)) {
        targetStatus = over.id as Status;
      } else {
        const overTask = tasks.find((t) => t.id === over.id);
        if (!overTask) return;
        targetStatus = overTask.status;
      }
      if (dragged.status !== targetStatus) {
        onStatusChange(dragged.id, targetStatus);
      }
    },
    [tasks, onStatusChange, statusGroups],
  );

  const isScrollable = statusGroups.length > 3;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(isScrollable && 'overflow-x-auto pb-2')}
        style={isScrollable ? { minHeight: 'calc(100vh - 260px)' } : undefined}
      >
        <div
          className={cn('items-start gap-4', isScrollable ? 'flex' : 'grid')}
          style={
            isScrollable
              ? { minWidth: `${statusGroups.length * 288 + (statusGroups.length - 1) * 16}px` }
              : { gridTemplateColumns: `repeat(${statusGroups.length}, minmax(0, 1fr))` }
          }
        >
          {statusGroups.map((group) => (
            <DroppableColumn
              key={group.id}
              group={group}
              colTasks={tasks.filter((t) => t.status === group.id)}
              allCollections={collections}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onStatusChange={onStatusChange}
              onCreateTask={onCreateTask}
              className={isScrollable ? 'w-72 shrink-0' : undefined}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-1 opacity-90 shadow-2xl">
            <TaskBoardCard
              task={activeTask}
              collections={collections}
              onDelete={() => {}}
              onUpdate={() => {}}
              onStatusChange={() => {}}
              isDragDisabled
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
