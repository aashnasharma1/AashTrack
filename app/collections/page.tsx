'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Layers, Trash2, ChevronDown, ArrowRight, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PriorityFlag, StatusBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { formatRelativeDate } from '@/utils/taskUtils';
import { fmtDuration, fmtScheduleDateTime } from '@/lib/timeUtils';

export default function CollectionsPage() {
  const { collections, tasks, addCollection, deleteCollection } = useTasks();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Collection name is required');
      return;
    }
    if (trimmed.length > 50) {
      setError('Max 50 characters');
      return;
    }
    const exists = collections.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setError('A collection with this name already exists');
      return;
    }
    addCollection(trimmed);
    setName('');
    setError('');
    toast.success(`Collection "${trimmed}" created`);
  };

  const handleDelete = (id: string, colName: string) => {
    if (confirmDeleteId === id) {
      deleteCollection(id);
      setConfirmDeleteId(null);
      if (expandedId === id) setExpandedId(null);
      toast.success(`Collection "${colName}" deleted`);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const taskCount = (slug: string) => tasks.filter((t) => t.collection === slug).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Collections</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Organise your tasks into collections. Click a collection to preview its tasks.
        </p>
      </div>

      {/* Add collection inline form */}
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            placeholder="New collection name…"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            error={error}
            maxLength={55}
            aria-label="New collection name"
          />
        </div>
        <Button onClick={handleAdd} size="sm" className="mt-0 shrink-0">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Collection list */}
      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <Layers className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mb-1 text-sm font-semibold text-gray-600 dark:text-gray-300">
            No collections yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Create a collection above, then add tasks inside it.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {collections.map((col) => {
            const count = taskCount(col.slug);
            const isDeleting = confirmDeleteId === col.id;
            const isExpanded = expandedId === col.id;
            const colTasks = tasks.filter((t) => t.collection === col.slug);

            return (
              <div
                key={col.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Header row */}
                <div className="group flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : col.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`collection-tasks-${col.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <Layers className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                        {col.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-600">
                        {count} task{count !== 1 ? 's' : ''} · created{' '}
                        {formatRelativeDate(col.createdAt)}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300',
                        isExpanded && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  <button
                    onClick={() => handleDelete(col.id, col.name)}
                    aria-label={
                      isDeleting ? 'Click again to confirm delete' : `Delete collection ${col.name}`
                    }
                    title={
                      isDeleting
                        ? 'Click again to confirm — this will also delete all tasks in this collection'
                        : undefined
                    }
                    className={cn(
                      'rounded p-1 opacity-0 transition-all group-hover:opacity-100',
                      isDeleting
                        ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800',
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Expandable task list — CSS grid height animation */}
                <div
                  id={`collection-tasks-${col.id}`}
                  role="region"
                  aria-label={`Tasks in ${col.name}`}
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-gray-100 dark:border-gray-800">
                      {colTasks.length === 0 ? (
                        <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-600">
                          No tasks in this collection yet.
                        </p>
                      ) : (
                        <ul
                          className="divide-y divide-gray-50 dark:divide-gray-800/60"
                          aria-label={`${col.name} tasks`}
                        >
                          {colTasks.map((task) => (
                            <li
                              key={task.id}
                              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
                            >
                              {/* Priority */}
                              <PriorityFlag priority={task.priority} className="mt-0.5" />

                              {/* Title + description */}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                    {task.description}
                                  </p>
                                )}
                                {/* Time range */}
                                {(task.startTime || task.endTime) && (
                                  <span className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-400 dark:text-gray-600">
                                    <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                                    {fmtScheduleDateTime(task.startDate, task.startTime) ??
                                      task.startTime ??
                                      ''}
                                    {task.startTime && task.endTime ? ' – ' : ''}
                                    {fmtScheduleDateTime(
                                      task.endDate ?? task.startDate,
                                      task.endTime,
                                    ) ??
                                      task.endTime ??
                                      ''}
                                    {fmtDuration(task.startTime, task.endTime) && (
                                      <span>· {fmtDuration(task.startTime, task.endTime)}</span>
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Status badge */}
                              <StatusBadge status={task.status} className="mt-0.5 shrink-0" />
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex justify-end border-t border-gray-50 px-4 py-2.5 dark:border-gray-800">
                        <Link
                          href={`/collections/${col.slug}`}
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Open collection
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
