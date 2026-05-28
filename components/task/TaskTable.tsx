'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { isOverdue, formatRemaining, formatTime, formatDuration } from '@/utils/scheduleUtils';
import type { Task } from '@/types/task';

const TH = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th
    scope="col"
    className={cn(
      'py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400',
      className,
    )}
  >
    {children}
  </th>
);

interface RowProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function SortableTaskRow({ task, onEdit, onDelete }: RowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const overdue = isOverdue(task);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(task.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group border-b border-gray-100 transition-colors dark:border-gray-800',
        isDragging
          ? 'z-10 opacity-60 shadow-xl'
          : overdue
            ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50'
            : 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/40',
      )}
      role="row"
      aria-label={`Task: ${task.title}${overdue ? ' (overdue)' : ''}`}
    >
      {/* Drag handle */}
      <td className="w-8 px-2 py-2.5">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className={cn(
            'cursor-grab touch-none rounded p-0.5',
            'opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100',
            'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            overdue ? 'text-red-300 dark:text-red-800' : 'text-gray-300 dark:text-gray-600',
          )}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>

      {/* Row number */}

      {/* Title */}
      <td className="max-w-[200px] py-2.5 pr-4">
        <div className="flex items-center gap-1">
          {overdue && (
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden="true" />
          )}
          <p
            className={cn(
              'truncate text-sm font-medium',
              overdue ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-gray-100',
            )}
            title={task.title}
          >
            {task.title}
          </p>
        </div>
        {task.description && (
          <p
            className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-600"
            title={task.description}
          >
            {task.description}
          </p>
        )}
      </td>

      {/* Priority */}
      <td className="py-2.5 pr-4">
        <PriorityBadge priority={task.priority} />
      </td>

      {/* Status */}
      <td className="py-2.5 pr-4">
        <StatusBadge status={task.status} />
      </td>

      <td className="whitespace-nowrap py-2.5 pr-4 text-xs text-gray-500 dark:text-gray-400">
        {formatTime(task.startTime)}
      </td>
      <td className="whitespace-nowrap py-2.5 pr-4 text-xs text-gray-500 dark:text-gray-400">
        {formatTime(task.effectiveEndTime)}
      </td>

      {/* Duration */}
      <td className="whitespace-nowrap py-2.5 pr-4 text-xs text-gray-500 dark:text-gray-400">
        {formatDuration(task.duration)}
      </td>

      {/* Remaining / overdue */}
      <td
        className={cn(
          'whitespace-nowrap py-2.5 pr-4 text-xs font-medium',
          overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-600',
        )}
      >
        {task.status !== 'done' ? formatRemaining(task) : '—'}
      </td>

      {/* Actions */}
      <td className="py-2.5 pr-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
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
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskTable({ tasks, onEdit, onDelete }: TaskTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full" role="table" aria-label="Module tasks">
        <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/60">
          <tr role="row">
            <th className="w-8 px-2" aria-hidden="true" />
            <th className="w-8 py-2.5 pr-3" aria-hidden="true" />
            <TH className="pr-4">Task</TH>
            <TH className="pr-4">Priority</TH>
            <TH className="pr-4">Status</TH>
            <TH className="pr-4">Start Time</TH>
            <TH className="pr-4">End Time</TH>
            <TH className="pr-4">Duration</TH>
            <TH className="pr-4">Remaining</TH>
            <TH className="pr-3 text-right">Actions</TH>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {tasks.map((task) => (
            <SortableTaskRow key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
