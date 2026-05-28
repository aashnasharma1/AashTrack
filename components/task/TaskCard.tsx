'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { truncate } from '@/utils/taskUtils';
import { isOverdue, formatRemaining, formatTime, formatDuration } from '@/utils/scheduleUtils';
import type { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isDragDisabled?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, isDragDisabled = false }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const overdue = isOverdue(task);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: isDragDisabled,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

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
      style={style}
      className={cn(
        'group relative rounded-xl border bg-white p-4 shadow-sm',
        'transition-all duration-150',
        'dark:bg-gray-900',
        isDragging
          ? 'z-50 scale-[1.02] opacity-90 shadow-xl'
          : overdue
            ? 'border-red-300 hover:border-red-400 dark:border-red-800 dark:hover:border-red-700'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:hover:border-gray-700',
        // Subtle red tint on overdue card
        overdue && 'bg-red-50/40 dark:bg-red-950/20',
      )}
      role="article"
      aria-label={`Task: ${task.title}${overdue ? ' (overdue)' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        {!isDragDisabled && (
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className={cn(
              'mt-0.5 flex-shrink-0 cursor-grab touch-none rounded p-0.5 text-gray-300',
              'opacity-0 transition-opacity group-hover:opacity-100',
              'hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800',
              'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              'active:cursor-grabbing',
            )}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header: title + badges */}
          <div className="flex flex-wrap items-start gap-2">
            <h3
              className={cn(
                'min-w-0 flex-1 text-sm font-semibold',
                overdue ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-gray-100',
              )}
              title={task.title}
            >
              {overdue && (
                <AlertCircle className="mr-1 inline h-3.5 w-3.5 text-red-500" aria-hidden="true" />
              )}
              {task.title}
            </h3>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
            </div>
          </div>

          {/* Description */}
          {hasDescription && (
            <div className="mt-1.5">
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {expanded ? task.description : truncate(task.description, 120)}
              </p>
              {task.description.length > 120 && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="mt-1 flex items-center gap-0.5 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                  aria-expanded={expanded}
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

          {/* Timing row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {formatTime(task.startTime)} → {formatTime(task.effectiveEndTime)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-600">
              {formatDuration(task.duration)}
            </span>
            {task.remainingMinutes !== null && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                (interrupted — {task.remainingMinutes}m resumed)
              </span>
            )}
          </div>

          {/* Footer: remaining / overdue + actions */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={cn(
                'text-xs font-medium',
                overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-600',
              )}
            >
              {task.status !== 'done' ? formatRemaining(task) : 'Completed'}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(task)}
                aria-label={`Edit task: ${task.title}`}
                className="h-7 w-7 p-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
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
        <div className="absolute inset-x-0 -bottom-0.5 flex items-center justify-center rounded-b-xl bg-red-50 py-1 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400">
          Click delete again to confirm
        </div>
      )}
    </div>
  );
}
