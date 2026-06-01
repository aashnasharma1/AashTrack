'use client';

import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { z } from 'zod';
import { taskReducer, initialState, type TaskAction } from '@/lib/taskReducer';
import { readStorage, writeStorage } from '@/lib/storage';
import type {
  TasksState,
  Collection,
  Task,
  TaskFormValues,
  FilterState,
  SortState,
  StatusGroup,
} from '@/types/task';
import { PRIORITIES, SORT_BY_OPTIONS, SORT_ORDER_OPTIONS } from '@/types/task';

const STORAGE_KEY = 'aashtrack_v2';

const recurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekdays', 'weekends', 'weekly', 'custom']),
  customDays: z.array(z.number().int().min(0).max(6)),
  occurrences: z.number().int().positive(),
});

const collectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
});

const statusGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string(),
  isDefault: z.boolean(),
});

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(PRIORITIES),
  status: z.string(),
  createdAt: z.string(),
  order: z.number(),
  collection: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  recurring: z.boolean().optional(),
  recurrence: recurrenceSchema.optional(),
});

const sortSchema = z.object({
  sortBy: z.enum(SORT_BY_OPTIONS),
  sortOrder: z.enum(SORT_ORDER_OPTIONS),
});

const persistedTasksSchema = z.object({
  collections: z.array(collectionSchema).optional(),
  statusGroups: z.array(statusGroupSchema).optional(),
  tasks: z.array(taskSchema).optional(),
  sort: sortSchema.optional(),
});

function load(): TasksState {
  const parsed = readStorage(STORAGE_KEY, persistedTasksSchema, {});
  return {
    collections: parsed.collections ?? [],
    statusGroups:
      parsed.statusGroups && parsed.statusGroups.length > 0
        ? parsed.statusGroups
        : initialState.statusGroups,
    tasks: parsed.tasks ?? [],
    filter: initialState.filter,
    sort: parsed.sort ?? initialState.sort,
  };
}

function save(state: TasksState): void {
  writeStorage(STORAGE_KEY, {
    collections: state.collections,
    statusGroups: state.statusGroups,
    tasks: state.tasks,
    sort: state.sort,
  });
}

interface TaskContextValue {
  state: TasksState;
  dispatch: React.Dispatch<TaskAction>;
  addCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  getCollection: (slug: string) => Collection | undefined;
  addTask: (v: TaskFormValues) => void;
  updateTask: (id: string, v: TaskFormValues) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  setFilter: (f: Partial<FilterState>) => void;
  setSort: (s: Partial<SortState>) => void;
  clearFilters: () => void;
  addStatusGroup: (label: string, color: string) => void;
  deleteStatusGroup: (id: string) => void;
  reorderStatusGroups: (groups: StatusGroup[]) => void;
  updateStatusGroup: (id: string, updates: { label?: string; color?: string }) => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    dispatch({ type: 'HYDRATE', payload: load() });
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    save(state);
  }, [state, isHydrated]);

  const addCollection = useCallback(
    (name: string) => dispatch({ type: 'ADD_COLLECTION', payload: { name } }),
    [],
  );
  const deleteCollection = useCallback(
    (id: string) => dispatch({ type: 'DELETE_COLLECTION', payload: id }),
    [],
  );
  const getCollection = useCallback(
    (slug: string) => state.collections.find((c) => c.slug === slug),
    [state.collections],
  );
  const addTask = useCallback(
    (v: TaskFormValues) => dispatch({ type: 'ADD_TASK', payload: v }),
    [],
  );
  const updateTask = useCallback(
    (id: string, v: TaskFormValues) => dispatch({ type: 'UPDATE_TASK', payload: { id, ...v } }),
    [],
  );
  const deleteTask = useCallback(
    (id: string) => dispatch({ type: 'DELETE_TASK', payload: id }),
    [],
  );
  const reorderTasks = useCallback(
    (tasks: Task[]) => dispatch({ type: 'REORDER_TASKS', payload: tasks }),
    [],
  );
  const setFilter = useCallback(
    (f: Partial<FilterState>) => dispatch({ type: 'SET_FILTER', payload: f }),
    [],
  );
  const setSort = useCallback(
    (s: Partial<SortState>) => dispatch({ type: 'SET_SORT', payload: s }),
    [],
  );
  const clearFilters = useCallback(() => dispatch({ type: 'CLEAR_FILTERS' }), []);

  const addStatusGroup = useCallback(
    (label: string, color: string) =>
      dispatch({ type: 'ADD_STATUS_GROUP', payload: { label, color } }),
    [],
  );
  const deleteStatusGroup = useCallback(
    (id: string) => dispatch({ type: 'DELETE_STATUS_GROUP', payload: id }),
    [],
  );
  const reorderStatusGroups = useCallback(
    (groups: StatusGroup[]) => dispatch({ type: 'REORDER_STATUS_GROUPS', payload: groups }),
    [],
  );
  const updateStatusGroup = useCallback(
    (id: string, updates: { label?: string; color?: string }) =>
      dispatch({ type: 'UPDATE_STATUS_GROUP', payload: { id, ...updates } }),
    [],
  );

  return (
    <TaskContext.Provider
      value={{
        state,
        dispatch,
        addCollection,
        deleteCollection,
        getCollection,
        addTask,
        updateTask,
        deleteTask,
        reorderTasks,
        setFilter,
        setSort,
        clearFilters,
        addStatusGroup,
        deleteStatusGroup,
        reorderStatusGroups,
        updateStatusGroup,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used inside TaskProvider');
  return ctx;
}
