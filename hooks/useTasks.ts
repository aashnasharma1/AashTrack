'use client';

import { useMemo } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { filterAndSortTasks, hasActiveFilters } from '@/utils/taskUtils';
import type { Task, TaskFormValues, FilterState, SortState } from '@/types/task';

export interface UseTasksReturn {
  tasks: Task[];
  filteredTasks: Task[];
  collections: string[];
  filter: FilterState;
  sort: SortState;
  isFiltered: boolean;
  addTask: (v: TaskFormValues) => void;
  updateTask: (id: string, v: TaskFormValues) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  setFilter: (f: Partial<FilterState>) => void;
  setSort: (s: Partial<SortState>) => void;
  clearFilters: () => void;
}

export function useTasks(): UseTasksReturn {
  const ctx = useTaskContext();
  const {
    state,
    collections,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    setFilter,
    setSort,
    clearFilters,
  } = ctx;

  const filteredTasks = useMemo(
    () => filterAndSortTasks(state.tasks, state.filter, state.sort),
    [state.tasks, state.filter, state.sort],
  );

  const isFiltered = useMemo(() => hasActiveFilters(state.filter), [state.filter]);

  return {
    tasks: state.tasks,
    filteredTasks,
    collections,
    filter: state.filter,
    sort: state.sort,
    isFiltered,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    setFilter,
    setSort,
    clearFilters,
  };
}
