'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
// import { DailyTimeline } from '@/components/dashboard/DailyTimeline';
import { WorkloadByStatus } from '@/components/dashboard/WorkloadByStatus';
import { TimeTracker } from '@/components/dashboard/TimeTracker';
import { TaskTableRow } from '@/components/task/TaskTableRow';
import { TaskForm } from '@/components/task/TaskForm';
import { ResizableTaskTable } from '@/components/task/ResizableTaskTable';
import { useTaskContext } from '@/context/TaskContext';
import type { Task, TaskFormValues } from '@/types/task';

function DashboardContent() {
  const { state, updateTask, deleteTask } = useTaskContext();
  const { tasks, collections } = state;

  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [formOpen, setFormOpen] = useState(false);

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleSubmit = (values: TaskFormValues) => {
    if (editingTask) {
      updateTask(editingTask.id, values);
      toast.success('Task updated');
    }
  };

  const handleDelete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    deleteTask(id);
    toast.success(`"${task?.title ?? 'Task'}" deleted`);
  };

  const handleStatusChange = (id: string, status: Task['status']) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    updateTask(id, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status,
      collection: task.collection,
      startTime: task.startTime,
      endTime: task.endTime,
      startDate: task.startDate,
      endDate: task.endDate,
    });
    toast.success('Status updated');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Timeline — full width */}
      {/* <DailyTimeline /> */}

      {/* Two-column insights row — min-h forces equal stretch */}
      <div className="grid h-[380px] grid-cols-1 gap-5 md:grid-cols-2">
        <WorkloadByStatus />
        <TimeTracker />
      </div>

      {/* All tasks table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">All Tasks</h2>
          <span className="text-xs text-gray-400 dark:text-gray-600">{tasks.length} total</span>
        </div>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-600">No tasks yet.</p>
            <Link
              href="/collections"
              className="text-xs text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
            >
              Go to a collection to create tasks
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <ResizableTaskTable ariaLabel="All tasks" showCollection>
              {tasks.map((task, idx) => (
                <TaskTableRow
                  key={task.id}
                  task={task}
                  rowIndex={idx + 1}
                  collections={collections}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  isLast={idx === tasks.length - 1}
                />
              ))}
            </ResizableTaskTable>
          </div>
        )}
      </div>

      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        defaultValues={editingTask}
        collections={collections}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
