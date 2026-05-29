'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PrioritySelector, ClickableStatusBadge, StatusBadge } from '@/components/ui/Badge';
import { TimeRangePicker } from '@/components/ui/TimePicker';
import { Button } from '@/components/ui/Button';
import { useTaskContext } from '@/context/TaskContext';
import { truncate, formatRelativeDate } from '@/utils/taskUtils';
import type { Collection, Priority, Task } from '@/types/task';

const PRIORITY_BORDER: Record<Priority, string> = {
  high: 'border-l-red-400 dark:border-l-red-500',
  medium: 'border-l-amber-400 dark:border-l-amber-500',
  low: 'border-l-gray-200 dark:border-l-gray-700',
};

interface TaskCardProps {
  task: Task;
  collections?: Collection[];
  onDelete: (id: string) => void;
  onUpdate?: (
    id: string,
    patch: { title?: string; priority?: Priority; startTime?: string; endTime?: string },
  ) => void;
  onStatusChange?: (id: string, status: Task['status']) => void;
  /** Keep for table/board callers that still wire the modal */
  onEdit?: (task: Task) => void;
  isDragDisabled?: boolean;
}

export function TaskCard({
  task,
  collections = [],
  onDelete,
  onUpdate,
  onStatusChange,
  onEdit,
  isDragDisabled = false,
}: TaskCardProps) {
  const collectionName = collections.find((c) => c.slug === task.collection)?.name ?? '';
  const {
    state: { statusGroups },
  } = useTaskContext();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Inline title edit
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleDraft(task.title);
  }, [task.title]);
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.select();
  }, [editingTitle]);

  const saveTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== task.title) onUpdate?.(task.id, { title: trimmed });
    else setTitleDraft(task.title);
    setEditingTitle(false);
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: isDragDisabled,
  });

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(task.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const hasDescription = task.description.trim().length > 0;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group relative rounded-xl border border-l-4 bg-white shadow-sm transition-all duration-150',
        'dark:bg-gray-900',
        isDragging
          ? 'z-50 scale-[1.02] border-blue-300 border-l-blue-400 opacity-90 shadow-xl dark:border-blue-700 dark:border-l-blue-500'
          : cn(
              'border-gray-200 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:hover:border-gray-700',
              PRIORITY_BORDER[task.priority],
            ),
      )}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      <div className="flex items-start gap-2.5 p-4">
        {/* Drag handle */}
        {!isDragDisabled && (
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className={cn(
              'mt-1 flex-shrink-0 cursor-grab touch-none rounded p-0.5 text-gray-300',
              'opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100',
              'hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800',
              'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
            )}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          {/* Title + status row */}
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              {editingTitle ? (
                <input
                  ref={titleInputRef}
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
                  className="w-full rounded px-1 text-base font-bold text-gray-900 outline-none ring-2 ring-blue-400 dark:bg-transparent dark:text-gray-100 dark:ring-blue-500"
                />
              ) : (
                <h3
                  onClick={() => {
                    if (onUpdate) setEditingTitle(true);
                    else onEdit?.(task);
                  }}
                  className={cn(
                    'text-base font-bold leading-snug text-gray-900 dark:text-gray-100',
                    onUpdate && 'cursor-text hover:text-blue-700 dark:hover:text-blue-400',
                  )}
                  title={onUpdate ? 'Click to edit title' : task.title}
                >
                  {task.title}
                </h3>
              )}
            </div>

            {onStatusChange ? (
              <ClickableStatusBadge
                status={task.status}
                groups={statusGroups}
                onCycle={(next) => onStatusChange(task.id, next)}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <StatusBadge status={task.status} groups={statusGroups} className="mt-0.5 shrink-0" />
            )}
          </div>

          {/* Description */}
          {hasDescription && (
            <div className="mt-2">
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {expanded ? task.description : truncate(task.description, 120)}
              </p>
              {task.description.length > 120 && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  aria-expanded={expanded}
                  className="mt-1 flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" /> Show more
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Footer: priority · time · collection · date · delete */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {/* Inline priority selector */}
            {onUpdate && (
              <PrioritySelector
                priority={task.priority}
                onChange={(p) => onUpdate(task.id, { priority: p })}
              />
            )}

            {/* Inline time range picker */}
            {onUpdate && (
              <TimeRangePicker
                startTime={task.startTime}
                endTime={task.endTime}
                onChange={(s, e) => onUpdate(task.id, { startTime: s, endTime: e })}
              />
            )}

            {/* Divider */}
            {onUpdate && (collectionName || true) && (
              <span className="h-3 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
            )}

            {collectionName && (
              <span className="truncate rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {collectionName}
              </span>
            )}

            {/* Right-side: date + delete */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <time
                dateTime={task.createdAt}
                className="text-xs text-gray-400 dark:text-gray-600"
                title={new Date(task.createdAt).toLocaleString()}
              >
                {formatRelativeDate(task.createdAt)}
              </time>
              <Button
                variant={confirmDelete ? 'danger' : 'ghost'}
                size="sm"
                onClick={handleDelete}
                aria-label={
                  confirmDelete ? 'Click again to confirm delete' : `Delete task: ${task.title}`
                }
                className="h-7 w-7 p-0"
                title={confirmDelete ? 'Click again to confirm' : 'Delete task'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <>
          <div
            className="absolute inset-x-0 -bottom-0.5 flex items-center justify-center rounded-b-xl bg-red-50 py-1 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400"
            aria-hidden="true"
          >
            Click delete again to confirm
          </div>
          <span role="status" aria-live="polite" className="sr-only">
            Press delete again to confirm deletion of &ldquo;{task.title}&rdquo;
          </span>
        </>
      )}
    </div>
  );
}
