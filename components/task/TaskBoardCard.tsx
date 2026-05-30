'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PrioritySelector, ClickableStatusBadge } from '@/components/ui/Badge';
import { TimeRangePicker } from '@/components/ui/TimePicker';
import { useTaskContext } from '@/context/TaskContext';
import type { Collection, Task, TaskPatch } from '@/types/task';

interface TaskBoardCardProps {
  task: Task;
  collections?: Collection[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: TaskPatch) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onEdit?: (task: Task) => void;
  isDragDisabled?: boolean;
}

export function TaskBoardCard({
  task,
  onDelete,
  onUpdate,
  onStatusChange,
  onEdit,
  isDragDisabled = false,
}: TaskBoardCardProps) {
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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: isDragDisabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative cursor-grab overflow-hidden rounded-lg border bg-white p-3 shadow-sm transition-all active:cursor-grabbing',
        'dark:bg-gray-800',
        isDragging
          ? 'scale-[1.02] border-blue-300 opacity-75 shadow-xl dark:border-blue-700'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:hover:border-gray-600',
      )}
      aria-label={`Task: ${task.title}`}
    >
      {/* Title row — title + edit/delete actions */}
      <div className="flex items-start gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
        <div className="min-w-0 flex-1">
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
              className="w-full rounded bg-transparent px-0.5 text-sm font-medium text-gray-900 outline-none ring-1 ring-blue-300 dark:text-gray-100 dark:ring-blue-700"
            />
          ) : (
            <p
              onClick={() => setEditingTitle(true)}
              className="cursor-text text-sm font-medium leading-snug text-gray-900 hover:text-blue-700 dark:text-gray-100 dark:hover:text-blue-400"
              title="Click to edit"
            >
              {task.title}
            </p>
          )}
        </div>

        {/* Action buttons — appear on hover */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              aria-label={`Edit task: ${task.title}`}
              className="rounded p-0.5 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-300"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            aria-label={confirmDelete ? 'Click again to confirm' : `Delete ${task.title}`}
            className={cn(
              'rounded p-0.5 transition-colors',
              confirmDelete
                ? 'text-red-500'
                : 'text-gray-300 hover:text-red-400 dark:text-gray-600',
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
          {task.description}
        </p>
      )}

      {/* Metadata row — time · priority · status */}
      <div
        className="mt-2.5 flex min-w-0 items-center gap-0.5 overflow-hidden"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <TimeRangePicker
          startTime={task.startTime}
          endTime={task.endTime}
          startDate={task.startDate}
          endDate={task.endDate}
          onChange={(s, e, sd, ed) =>
            onUpdate(task.id, { startTime: s, endTime: e, startDate: sd, endDate: ed })
          }
        />
        <PrioritySelector
          priority={task.priority}
          onChange={(p) => onUpdate(task.id, { priority: p })}
        />
        <ClickableStatusBadge
          status={task.status}
          groups={statusGroups}
          onCycle={(next) => onStatusChange(task.id, next)}
          className="ml-auto"
        />
      </div>
    </div>
  );
}
