'use client';

import { Trash2, GripVertical, Pencil } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  PrioritySelector,
  ClickableStatusBadge,
  RecurringBadge,
  OverdueBadge,
} from '@/components/ui/Badge';
import { isTaskOverdue } from '@/lib/taskUtils';
import { TimeRangePicker } from '@/components/ui/TimePicker';
import { useTaskContext } from '@/context/TaskContext';
import { useInlineEdit } from '@/hooks/useInlineEdit';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import type { Collection, Task, TaskPatch } from '@/types/task';

interface TaskListItemProps {
  task: Task;
  collections?: Collection[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: TaskPatch) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onEdit?: (task: Task) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function TaskListItem({
  task,
  onDelete,
  onUpdate,
  onStatusChange,
  onEdit,
  dragHandleProps,
}: TaskListItemProps) {
  const {
    state: { statusGroups },
  } = useTaskContext();

  const {
    editing: editingTitle,
    draft: titleDraft,
    inputRef,
    startEditing: startEditingTitle,
    setDraft: setTitleDraft,
    save: saveTitle,
    handleKeyDown: handleTitleKeyDown,
  } = useInlineEdit({
    value: task.title,
    onSave: (v) => onUpdate(task.id, { title: v }),
  });

  const { confirming: confirmDelete, handleDelete } = useConfirmDelete(() => onDelete(task.id));

  return (
    <div
      className={cn(
        'group grid items-center gap-2 px-3 py-2 transition-colors',
        'grid-cols-[20px_1fr_112px_52px_88px_56px]',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        confirmDelete && 'bg-red-50/40 dark:bg-red-950/20',
      )}
      role="row"
      aria-label={`Task: ${task.title}`}
    >
      {/* Drag handle */}
      <button
        type="button"
        aria-label="Drag to reorder"
        className={cn(
          'flex items-center justify-center rounded p-0.5 transition-colors',
          dragHandleProps
            ? 'cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing dark:text-gray-600 dark:hover:text-gray-400'
            : 'pointer-events-none cursor-default text-transparent',
        )}
        {...(dragHandleProps ?? {})}
      >
        <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {/* Name + description */}
      <div className="min-w-0">
        {editingTitle ? (
          <input
            ref={inputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={handleTitleKeyDown}
            maxLength={100}
            className="w-full rounded bg-transparent px-1 text-sm font-medium text-gray-900 outline-none ring-1 ring-blue-300 dark:text-gray-100 dark:ring-blue-700"
          />
        ) : (
          <button
            type="button"
            onClick={() => startEditingTitle()}
            className="w-full text-left"
            title="Click to edit title"
          >
            <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-gray-900 hover:text-blue-700 dark:text-gray-100 dark:hover:text-blue-400">
              <span className="truncate">{task.title}</span>
              {task.recurring && <RecurringBadge className="shrink-0" />}
              {isTaskOverdue(task) && <OverdueBadge className="shrink-0" />}
            </span>
          </button>
        )}
        {task.description && (
          <span className="block truncate text-xs text-gray-400 dark:text-gray-600">
            {task.description}
          </span>
        )}
      </div>

      {/* Schedule */}
      <div className="min-w-0 overflow-hidden">
        <TimeRangePicker
          startTime={task.startTime}
          endTime={task.endTime}
          startDate={task.startDate}
          endDate={task.endDate}
          onChange={(s, e, sd, ed) =>
            onUpdate(task.id, { startTime: s, endTime: e, startDate: sd, endDate: ed })
          }
        />
      </div>

      {/* Priority */}
      <div className="flex shrink-0 justify-center">
        <PrioritySelector
          priority={task.priority}
          onChange={(p) => onUpdate(task.id, { priority: p })}
        />
      </div>

      {/* Status */}
      <div className="shrink-0">
        <ClickableStatusBadge
          status={task.status}
          groups={statusGroups}
          onCycle={(next) => onStatusChange(task.id, next)}
        />
      </div>

      {/* Edit + Delete */}
      <div className="flex shrink-0 items-center gap-0.5">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit task: ${task.title}`}
            className="rounded p-1 text-gray-300 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 focus-visible:opacity-100 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          aria-label={
            confirmDelete ? 'Click again to confirm delete' : `Delete task: ${task.title}`
          }
          className={cn(
            'rounded p-1 opacity-0 transition-all focus-visible:opacity-100 group-hover:opacity-100',
            confirmDelete
              ? 'text-red-500'
              : 'text-gray-300 hover:bg-gray-100 hover:text-red-400 dark:text-gray-600 dark:hover:bg-gray-700',
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {confirmDelete && (
        <span role="status" aria-live="polite" className="sr-only">
          Press delete again to confirm deletion of &ldquo;{task.title}&rdquo;
        </span>
      )}
    </div>
  );
}
