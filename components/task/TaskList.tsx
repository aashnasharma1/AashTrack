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
import { ResizableTaskTable } from './ResizableTaskTable';
import { Button } from '@/components/ui/Button';
import { KeyboardShortcuts } from '@/components/ui/KeyboardShortcuts';
import { cn } from '@/lib/cn';
import { filterAndSortTasks } from '@/utils/taskUtils';
import { resolveScheduleConflicts } from '@/lib/scheduling';
import { isPriority, type Task, type TaskFormValues } from '@/types/task';

type ViewMode = 'grouped' | 'board' | 'table';

interface TaskListProps {
  /** When set, locks the view to a single collection (used by collection detail pages). */
  lockedCollection?: string;
}

export function TaskList({ lockedCollection }: TaskListProps = {}) {
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

  // Sync URL → filter state on mount (skipped when collection is locked)
  useEffect(() => {
    if (lockedCollection) return;
    const status = searchParams.get('status') ?? '';
    const priorityParam = searchParams.get('priority');
    const priority = isPriority(priorityParam) ? priorityParam : '';
    const collection = searchParams.get('collection') ?? '';
    if (status || priority || collection) {
      setFilter({ status, priority, collection });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

  // Sync filter state → URL (skipped when collection is locked)
  useEffect(() => {
    if (lockedCollection) return;
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.priority) params.set('priority', filter.priority);
    if (filter.collection) params.set('collection', filter.collection);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [filter, pathname, router, lockedCollection]);

  // When locked: filter tasks to this collection then apply status/priority
  const displayTasks = useMemo(() => {
    let base: Task[];
    if (lockedCollection) {
      const scoped = tasks.filter((t) => t.collection === lockedCollection);
      base = filterAndSortTasks(scoped, { ...filter, collection: '' }, sort);
    } else {
      base = filteredTasks;
    }
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [tasks, filteredTasks, filter, sort, lockedCollection, search]);

  const openCreate = useCallback(() => {
    setEditingTask(undefined);
    setModalOpen(true);
  }, []);

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
      startDate: task.startDate,
      endDate: task.endDate,
    });
    toast.success(`Status updated`);
  };

  const handleGroupedReorder = useCallback(
    (reordered: Task[]) => {
      const ids = new Set(reordered.map((t) => t.id));
      const others = tasks.filter((t) => !ids.has(t.id));
      reorderTasks([...reordered, ...others]);
      setSort({ sortBy: 'manual', sortOrder: 'asc' });
    },
    [tasks, reorderTasks, setSort],
  );

  const handleUpdate = useCallback(
    (
      id: string,
      patch: {
        title?: string;
        priority?: Task['priority'];
        startTime?: string;
        endTime?: string;
        startDate?: string;
        endDate?: string;
      },
    ) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const nextValues: TaskFormValues = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        collection: task.collection,
        startTime: task.startTime,
        endTime: task.endTime,
        startDate: task.startDate,
        endDate: task.endDate,
        ...patch,
      };

      if (
        patch.priority !== undefined ||
        patch.startTime !== undefined ||
        patch.endTime !== undefined ||
        patch.startDate !== undefined ||
        patch.endDate !== undefined
      ) {
        const resolution = resolveScheduleConflicts(tasks, nextValues, id);
        if (!resolution.ok) {
          toast.error(resolution.error ?? 'A task already occupies this time slot.');
          return;
        }

        resolution.shiftedTasks.forEach(
          ({ task: shifted, startTime, endTime, startDate, endDate }) => {
            updateTask(shifted.id, {
              title: shifted.title,
              description: shifted.description,
              priority: shifted.priority,
              status: shifted.status,
              collection: shifted.collection,
              startTime,
              endTime,
              startDate,
              endDate,
            });
          },
        );
      }

      updateTask(id, nextValues);
    },
    [tasks, updateTask],
  );

  // When locked, don't show the collection filter chip
  const filterBarCollections = lockedCollection ? [] : collections;
  const effectiveIsFiltered = lockedCollection
    ? filter.status !== '' || filter.priority !== '' || !!search
    : isFiltered || !!search;

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar row 1 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div data-tour="filter-bar">
          <FilterBar
            filter={filter}
            sort={sort}
            collections={filterBarCollections}
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
          {!lockedCollection && (
            <button
              data-tour="shortcuts"
              onClick={() => setShortcutsOpen(true)}
              aria-label="Keyboard shortcuts (?)"
              title="Keyboard shortcuts (?)"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:hover:text-gray-300"
            >
              ?
            </button>
          )}
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
          <button
            type="button"
            onClick={() => setManagerOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
            Manage categories
          </button>
        </div>
      </div>

      {displayTasks.length === 0 ? (
        <EmptyState
          isFiltered={effectiveIsFiltered}
          onClearFilters={() => {
            clearFilters();
            setSearch('');
          }}
          onCreateTask={openCreate}
        />
      ) : viewMode === 'board' ? (
        <TaskBoard
          tasks={displayTasks}
          collections={collections}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onStatusChange={handleStatusChange}
          onEdit={openEdit}
          onCreateTask={openCreate}
        />
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <ResizableTaskTable ariaLabel="Task list" sort={sort} showCollection={!lockedCollection}>
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
                showCollection={!lockedCollection}
              />
            ))}
          </ResizableTaskTable>
        </div>
      ) : (
        <TaskGrouped
          tasks={displayTasks}
          collections={collections}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onStatusChange={handleStatusChange}
          onEdit={openEdit}
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
        lockedCollection={lockedCollection}
      />

      <StatusGroupManager open={managerOpen} onClose={() => setManagerOpen(false)} />

      {!lockedCollection && (
        <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      )}
    </div>
  );
}
