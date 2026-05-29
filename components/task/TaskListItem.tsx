'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PrioritySelector, ClickableStatusBadge } from '@/components/ui/Badge';
import { TimeRangePicker } from '@/components/ui/TimePicker';
import { useTaskContext } from '@/context/TaskContext';
import type { Collection, Priority, Task } from '@/types/task';

interface TaskListItemProps {
  task: Task;
  collections?: Collection[];
  onDelete: (id: string) => void;
  onUpdate: (
    id: string,
    patch: { title?: string; priority?: Priority; startTime?: string; endTime?: string },
  ) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function TaskListItem({
  task,
  onDelete,
  onUpdate,
  onStatusChange,
  dragHandleProps,
}: TaskListItemProps) {
  const {
    state: { statusGroups },
  } = useTaskContext();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleDraft(task.title);
  }, [task.title]);
  useEffect(() => {
    if (editingTitle) inputRef.current?.select();
  }, [editingTitle]);

  const saveTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== task.title) onUpdate(task.id, { title: trimmed });
    else setTitleDraft(task.title);
    setEditingTitle(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(task.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      className={cn(
        'group grid items-center gap-2 px-3 py-2 transition-colors',
        'grid-cols-[20px_1fr_112px_52px_88px_28px]',
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                saveTitle();
              }
              if (e.key === 'Escape') {
                setTitleDraft(task.title);
                setEditingTitle(false);
              }
            }}
            maxLength={100}
            className="w-full rounded bg-transparent px-1 text-sm font-medium text-gray-900 outline-none ring-1 ring-blue-300 dark:text-gray-100 dark:ring-blue-700"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="w-full text-left"
            title="Click to edit title"
          >
            <span className="block truncate text-sm font-medium text-gray-900 hover:text-blue-700 dark:text-gray-100 dark:hover:text-blue-400">
              {task.title}
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
      <div className="shrink-0">
        <TimeRangePicker
          startTime={task.startTime}
          endTime={task.endTime}
          onChange={(s, e) => onUpdate(task.id, { startTime: s, endTime: e })}
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

      {/* Delete */}
      <div className="shrink-0">
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
