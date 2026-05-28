import { TaskList } from '@/components/task/TaskList';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Tasks</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your work, one task at a time.
        </p>
      </div>
      <TaskList />
    </div>
  );
}
