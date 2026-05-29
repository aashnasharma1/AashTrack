import { ClipboardList, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  isFiltered: boolean;
  onClearFilters: () => void;
  onCreateTask: () => void;
}

export function EmptyState({ isFiltered, onClearFilters, onCreateTask }: EmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <FilterX className="h-7 w-7 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">
          No matching tasks
        </h3>
        <p className="mb-5 max-w-xs text-sm text-gray-500 dark:text-gray-400">
          No tasks match your current filters. Try adjusting or clearing them.
        </p>
        <Button variant="secondary" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
        <ClipboardList className="h-7 w-7 text-blue-400" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">
        No tasks yet
      </h3>
      <p className="mb-5 max-w-xs text-sm text-gray-500 dark:text-gray-400">
        Create your first task to get started. Think of this as your personal command center.
      </p>
      <Button onClick={onCreateTask}>Create your first task</Button>
    </div>
  );
}
