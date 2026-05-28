import { cn } from '@/lib/cn';
import type { Priority, Status } from '@/types/task';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/types/task';

const priorityStyles: Record<Priority, string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  medium:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  high: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
};

const statusStyles: Record<Status, string> = {
  todo: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  'in-progress':
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  done: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
};

const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium';

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span className={cn(base, priorityStyles[priority], className)}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return <span className={cn(base, statusStyles[status], className)}>{STATUS_LABELS[status]}</span>;
}
