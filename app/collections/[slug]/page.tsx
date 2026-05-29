'use client';

import { useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ChevronRight, ArrowLeft, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskContext } from '@/context/TaskContext';
import { TaskTableRow } from '@/components/task/TaskTableRow';
import { TaskForm } from '@/components/task/TaskForm';
import { FilterBar } from '@/components/task/FilterBar';
import { EmptyState } from '@/components/task/EmptyState';
import { Button } from '@/components/ui/Button';
import { filterAndSortTasks, hasActiveFilters } from '@/utils/taskUtils';
import type { Task, TaskFormValues, FilterState, SortState } from '@/types/task';

export default function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const { state, getCollection, addTask, updateTask, deleteTask } = useTaskContext();

  const collection = getCollection(slug);
  const collectionTasks = useMemo(
    () => state.tasks.filter((t) => t.collection === slug),
    [state.tasks, slug],
  );

  const [filter, setFilterState] = useState<FilterState>({
    status: '',
    priority: '',
    collection: slug,
  });
  const [sort, setSortState] = useState<SortState>({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const isFiltered = hasActiveFilters({ ...filter, collection: '' });
  const filteredTasks = useMemo(
    () => filterAndSortTasks(collectionTasks, { ...filter, collection: '' }, sort),
    [collectionTasks, filter, sort],
  );
  const displayTasks = useMemo(() => {
    if (!search.trim()) return filteredTasks;
    const q = search.toLowerCase();
    return filteredTasks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [filteredTasks, search]);

  const handleSubmit = (values: TaskFormValues) => {
    if (editingTask) {
      updateTask(editingTask.id, values);
      toast.success('Task updated');
    } else {
      addTask({ ...values, collection: slug });
      toast.success('Task created');
    }
  };

  const handleDelete = (id: string) => {
    const task = collectionTasks.find((t) => t.id === id);
    deleteTask(id);
    toast.success(`"${task?.title ?? 'Task'}" deleted`);
  };

  const handleStatusChange = (id: string, status: Task['status']) => {
    const task = collectionTasks.find((t) => t.id === id);
    if (!task) return;
    updateTask(id, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status,
      collection: task.collection,
      startTime: task.startTime,
      endTime: task.endTime,
    });
    toast.success(
      `Marked as ${status === 'in-progress' ? 'In Progress' : status === 'done' ? 'Done' : 'To Do'}`,
    );
  };

  const openCreate = () => {
    setEditingTask(undefined);
    setTaskFormOpen(true);
  };
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
  };

  const handleFilterChange = (f: Partial<FilterState>) =>
    setFilterState((prev) => ({ ...prev, ...f }));
  const handleSortChange = (s: Partial<SortState>) => setSortState((prev) => ({ ...prev, ...s }));
  const handleClearFilters = () => setFilterState({ status: '', priority: '', collection: slug });

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Collection not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/collections')}>
          <ArrowLeft className="h-4 w-4" /> Back to collections
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600"
      >
        <Link href="/collections" className="hover:text-gray-600 dark:hover:text-gray-300">
          Collections
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-700 dark:text-gray-300">{collection.name}</span>
      </nav>

      {/* Collection header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{collection.name}</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {collectionTasks.length} task{collectionTasks.length !== 1 ? 's' : ''} in this collection
        </p>
      </div>

      {/* Toolbar row 1: filter chips + new task */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar
          filter={filter}
          sort={sort}
          collections={[]}
          isSearchActive={search !== ''}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onClearFilters={() => {
            handleClearFilters();
            setSearch('');
          }}
        />
        <Button onClick={openCreate} size="sm" className="shrink-0">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Toolbar row 2: search */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <Search
            className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-gray-400"
            aria-hidden="true"
          />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks… (press / to focus)"
            aria-label="Search tasks by title or description"
            className="h-8 w-64 rounded-full border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-600"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                searchRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-2 rounded-full p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {displayTasks.length === 0 ? (
        <EmptyState
          isFiltered={isFiltered || !!search}
          onClearFilters={() => {
            handleClearFilters();
            setSearch('');
          }}
          onCreateTask={openCreate}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full" role="table" aria-label="Collection tasks">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th
                  scope="col"
                  className="w-10 px-3 py-2.5 text-right text-xs font-medium text-gray-300 dark:text-gray-700"
                >
                  #
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                >
                  Schedule
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                >
                  Priority
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                >
                  Collection
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTasks.map((task, idx) => (
                <TaskTableRow
                  key={task.id}
                  task={task}
                  rowIndex={idx + 1}
                  collections={state.collections}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  isLast={idx === displayTasks.length - 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskForm
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        onSubmit={handleSubmit}
        defaultValues={editingTask}
        collections={state.collections}
        lockedCollection={slug}
      />
    </div>
  );
}
