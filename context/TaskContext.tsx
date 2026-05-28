'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { taskReducer, initialState, type TaskAction } from '@/lib/taskReducer';
import type { TasksState, Task, TaskFormValues, FilterState, SortState } from '@/types/task';

const STORAGE_KEY = 'aashtrack_tasks';

function load(): TasksState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<TasksState>;
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      filter: initialState.filter,
      sort: parsed.sort ?? initialState.sort,
    };
  } catch {
    return initialState;
  }
}

function save(state: TasksState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: state.tasks, sort: state.sort }));
  } catch {
    // quota exceeded or unavailable — silently continue
  }
}

interface TaskContextValue {
  state: TasksState;
  dispatch: React.Dispatch<TaskAction>;
  collections: string[];
  addTask: (v: TaskFormValues) => void;
  updateTask: (id: string, v: TaskFormValues) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  setFilter: (f: Partial<FilterState>) => void;
  setSort: (s: Partial<SortState>) => void;
  clearFilters: () => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    dispatch({ type: 'HYDRATE', payload: load() });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    save(state);
  }, [state]);

  // Derive sorted unique collection names from tasks
  const collections = useMemo(() => {
    const set = new Set(state.tasks.map((t) => t.collection).filter(Boolean));
    return Array.from(set).sort();
  }, [state.tasks]);

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

  return (
    <TaskContext.Provider
      value={{
        state,
        dispatch,
        collections,
        addTask,
        updateTask,
        deleteTask,
        reorderTasks,
        setFilter,
        setSort,
        clearFilters,
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
