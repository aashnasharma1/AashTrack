'use client';

import { useMemo } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { filterAndSortTasks, hasActiveFilters } from '@/utils/taskUtils';
import type { Collection, Task, TaskFormValues, FilterState, SortState } from '@/types/task';

export interface UseTasksReturn {
  collections: Collection[];
  tasks: Task[];
  filteredTasks: Task[];
  filter: FilterState;
  sort: SortState;
  isFiltered: boolean;
  addCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  addTask: (v: TaskFormValues) => void;
  updateTask: (id: string, v: TaskFormValues) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  setFilter: (f: Partial<FilterState>) => void;
  setSort: (s: Partial<SortState>) => void;
  clearFilters: () => void;
}

export function useTasks(): UseTasksReturn {
  const {
    state,
    addCollection,
    deleteCollection,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    setFilter,
    setSort,
    clearFilters,
  } = useTaskContext();

  const filteredTasks = useMemo(
    () => filterAndSortTasks(state.tasks, state.filter, state.sort),
    [state.tasks, state.filter, state.sort],
  );

  const isFiltered = useMemo(() => hasActiveFilters(state.filter), [state.filter]);

  return {
    collections: state.collections,
    tasks: state.tasks,
    filteredTasks,
    filter: state.filter,
    sort: state.sort,
    isFiltered,
    addCollection,
    deleteCollection,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    setFilter,
    setSort,
    clearFilters,
  };
}
