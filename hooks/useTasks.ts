'use client';

import { useMemo } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { filterAndSortTasks, hasActiveFilters } from '@/utils/taskUtils';
import type { Task, TaskFormValues, FilterState, SortState } from '@/types/task';

export interface UseTasksReturn {
  tasks: Task[];
  filteredTasks: Task[];
  filter: FilterState;
  sort: SortState;
  isFiltered: boolean;
  addTask: (values: TaskFormValues) => void;
  updateTask: (id: string, values: TaskFormValues) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  setSort: (sort: Partial<SortState>) => void;
  clearFilters: () => void;
}

export function useTasks(): UseTasksReturn {
  const { state, addTask, updateTask, deleteTask, reorderTasks, setFilter, setSort, clearFilters } =
    useTaskContext();

  const filteredTasks = useMemo(
    () => filterAndSortTasks(state.tasks, state.filter, state.sort),
    [state.tasks, state.filter, state.sort],
  );

  const isFiltered = useMemo(() => hasActiveFilters(state.filter), [state.filter]);

  return {
    tasks: state.tasks,
    filteredTasks,
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
