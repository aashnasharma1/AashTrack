'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Plus, Table2, Kanban, Rows3, Search, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTasks } from '@/hooks/useTasks';
import { TaskTableRow } from './TaskTableRow';
import { TaskBoard } from './TaskBoard';
import { TaskGrouped } from './TaskGrouped';
import { TaskForm } from './TaskForm';
import { FilterBar } from './FilterBar';
import { StatusGroupManager } from './StatusGroupManager';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/Button';
import { KeyboardShortcuts } from '@/components/ui/KeyboardShortcuts';
import { cn } from '@/lib/cn';
import type { Task, TaskFormValues, Status, Priority } from '@/types/task';

type ViewMode = 'grouped' | 'board' | 'table';

export function TaskList() {
  const {
    tasks,
    filteredTasks,
    collections,
    filter,
    sort,
    isFiltered,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    setFilter,
    setSort,
    clearFilters,
  } = useTasks();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [modalOpen, setModalOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync URL → filter state on mount
  useEffect(() => {
    const status = searchParams.get('status') as Status | null;
    const priority = searchParams.get('priority') as Priority | null;
    const collection = searchParams.get('collection') ?? '';
    const anySet = status || priority || collection;
    if (anySet) {
      setFilter({
        status: status ?? '',
        priority: priority ?? '',
        collection,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

  // Sync filter state → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.priority) params.set('priority', filter.priority);
    if (filter.collection) params.set('collection', filter.collection);
    const qs = params.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    router.replace(target, { scroll: false });
  }, [filter, pathname, router]);

  const displayTasks = useMemo(() => {
    if (!search.trim()) return filteredTasks;
    const q = search.toLowerCase();
    return filteredTasks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [filteredTasks, search]);

  const openCreate = useCallback(() => {
    setEditingTask(undefined);
    setModalOpen(true);
  }, []);

  // Global keyboard shortcut: N = new task, ? = shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (modalOpen) return;
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === '/') {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openCreate();
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [modalOpen, openCreate]);

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSubmit = (values: TaskFormValues) => {
    if (editingTask) {
      updateTask(editingTask.id, values);
      toast.success('Task updated');
    } else {
      addTask(values);
      toast.success('Task created');
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
    });
    toast.success(
      `Marked as ${status === 'in-progress' ? 'In Progress' : status === 'done' ? 'Done' : 'To Do'}`,
    );
  };

  const handleGroupedReorder = useCallback(
    (reordered: Task[]) => {
      const reorderedIds = new Set(reordered.map((t) => t.id));
      const others = tasks.filter((t) => !reorderedIds.has(t.id));
      reorderTasks([...reordered, ...others]);
      setSort({ sortBy: 'manual', sortOrder: 'asc' });
    },
    [tasks, reorderTasks, setSort],
  );

  const handleUpdate = useCallback(
    (
      id: string,
      patch: { title?: string; priority?: Task['priority']; startTime?: string; endTime?: string },
    ) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      updateTask(id, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        collection: task.collection,
        startTime: task.startTime,
        endTime: task.endTime,
        ...patch,
      });
    },
    [tasks, updateTask],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar row 1: filter chips + view controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div data-tour="filter-bar">
          <FilterBar
            filter={filter}
            sort={sort}
            collections={collections}
            isSearchActive={search !== ''}
            onFilterChange={setFilter}
            onSortChange={setSort}
            onClearFilters={() => {
              clearFilters();
              setSearch('');
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            data-tour="view-toggle"
            className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900"
          >
            {(
              [
                { mode: 'grouped', icon: Rows3, label: 'Grouped view' },
                { mode: 'board', icon: Kanban, label: 'Board view' },
                { mode: 'table', icon: Table2, label: 'Table view' },
              ] as const
            ).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                aria-label={label}
                aria-pressed={viewMode === mode}
                title={label}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                  viewMode === mode
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <button
            data-tour="shortcuts"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard shortcuts (?)"
            title="Keyboard shortcuts (?)"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:hover:text-gray-300"
          >
            ?
          </button>
          <Button
            data-tour="new-task"
            onClick={openCreate}
            size="sm"
            className="shrink-0"
            title="New task (N)"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Task
          </Button>
        </div>
      </div>

      {/* Toolbar row 2: search + manage categories */}
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
        <div className="ml-auto">
          {viewMode === 'grouped' && (
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
              Manage categories
            </button>
          )}
        </div>
      </div>

      {displayTasks.length === 0 ? (
        <EmptyState
          isFiltered={isFiltered || !!search}
          onClearFilters={() => {
            clearFilters();
            setSearch('');
          }}
          onCreateTask={openCreate}
        />
      ) : viewMode === 'board' ? (
        /* ── Board view ── */
        <TaskBoard
          tasks={displayTasks}
          collections={collections}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onStatusChange={handleStatusChange}
          onCreateTask={openCreate}
        />
      ) : viewMode === 'table' ? (
        /* ── Table view ── */
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full" role="table" aria-label="Task list">
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
                  aria-sort={
                    sort.sortBy === 'title'
                      ? sort.sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
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
                  aria-sort={
                    sort.sortBy === 'priority'
                      ? sort.sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
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
                  collections={collections}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  isLast={idx === displayTasks.length - 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Grouped view (default) ── */
        <TaskGrouped
          tasks={displayTasks}
          collections={collections}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onStatusChange={handleStatusChange}
          onReorder={handleGroupedReorder}
          onCreateTask={openCreate}
        />
      )}

      <TaskForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        defaultValues={editingTask}
        collections={collections}
      />

      <StatusGroupManager open={managerOpen} onClose={() => setManagerOpen(false)} />

      <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
