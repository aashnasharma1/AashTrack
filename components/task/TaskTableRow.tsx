'use client';

import { Pencil, Trash2, CircleDashed, Loader2, CheckCircle2, Clock } from 'lucide-react';
import {
  ClickableStatusBadge,
  PriorityFlag,
  RecurringBadge,
  OverdueBadge,
} from '@/components/ui/Badge';
import { isTaskOverdue } from '@/lib/taskUtils';
import { Button } from '@/components/ui/Button';
import { useTaskContext } from '@/context/TaskContext';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { cn } from '@/lib/cn';
import type { Collection, Status, Task } from '@/types/task';

const STATUS_ICON: Record<Status, { icon: React.ElementType; cls: string }> = {
  todo: { icon: CircleDashed, cls: 'text-rose-400' },
  'in-progress': { icon: Loader2, cls: 'text-blue-500' },
  done: { icon: CheckCircle2, cls: 'text-emerald-500' },
};

interface TaskTableRowProps {
  task: Task;
  rowIndex: number;
  collections: Collection[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  isLast: boolean;
  showCollection?: boolean;
}

export function TaskTableRow({
  task,
  rowIndex,
  collections,
  onEdit,
  onDelete,
  onStatusChange,
  isLast,
  showCollection = true,
}: TaskTableRowProps) {
  const {
    state: { statusGroups },
  } = useTaskContext();
  const { confirming: confirmDelete, handleDelete } = useConfirmDelete(() => onDelete(task.id));
  const collectionName =
    collections.find((c) => c.slug === task.collection)?.name ?? task.collection;
  const statusIcon = STATUS_ICON[task.status];
  const SIcon = statusIcon?.icon ?? CircleDashed;
  const sCls = statusIcon?.cls ?? 'text-gray-400';

  return (
    <tr
      className={cn(
        'group transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40',
        !isLast && 'border-b border-gray-100 dark:border-gray-800/60',
      )}
      role="row"
    >
      {/* Row number */}
      <td className="w-10 px-3 py-3 text-right">
        <span className="text-xs tabular-nums text-gray-300 dark:text-gray-700">{rowIndex}</span>
      </td>

      {/* Name — status icon + title + description */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <SIcon className={cn('h-4 w-4 shrink-0', sCls)} aria-hidden="true" />
          <div className="min-w-0">
            <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
              <span className="truncate" title={task.title}>
                {task.title}
              </span>
              {task.recurring && <RecurringBadge className="shrink-0" />}
              {isTaskOverdue(task) && <OverdueBadge className="shrink-0" />}
            </span>
            {task.description && (
              <span className="block max-w-xs truncate text-xs text-gray-400 dark:text-gray-600">
                {task.description}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <ClickableStatusBadge
          status={task.status}
          groups={statusGroups}
          onCycle={(next) => onStatusChange(task.id, next)}
        />
      </td>

      {/* Schedule */}
      <td className="px-3 py-3">
        {task.startTime || task.endTime ? (
          <span className="flex items-center gap-1 text-xs tabular-nums text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3 text-gray-400" aria-hidden="true" />
            {task.startTime ?? ''}
            {task.startTime && task.endTime ? ' – ' : ''}
            {task.endTime ?? ''}
          </span>
        ) : (
          <span className="text-xs text-gray-300 dark:text-gray-700">—</span>
        )}
      </td>

      {/* Priority */}
      <td className="px-3 py-3">
        <PriorityFlag priority={task.priority} />
      </td>

      {/* Collection — hidden when already scoped to a collection */}
      {showCollection && (
        <td className="px-3 py-3">
          {collectionName && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {collectionName}
            </span>
          )}
        </td>
      )}

      {/* Actions */}
      <td className="px-3 py-3 text-right">
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
              confirmDelete ? `Confirm delete: ${task.title}` : `Delete task: ${task.title}`
            }
            title={confirmDelete ? 'Click again to confirm' : undefined}
            className="h-7 w-7 p-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {confirmDelete && (
          <span role="status" aria-live="polite" className="sr-only">
            Press delete again to confirm deletion of &ldquo;{task.title}&rdquo;
          </span>
        )}
      </td>
    </tr>
  );
}
