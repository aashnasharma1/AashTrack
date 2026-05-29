import { Suspense } from 'react';
import { TaskList } from '@/components/task/TaskList';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          All your tasks across every collection.
        </p>
      </div>
      <Suspense>
        <TaskList />
      </Suspense>
    </div>
  );
}
