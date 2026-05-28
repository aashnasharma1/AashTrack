'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { taskReducer, type TaskAction } from '@/lib/taskReducer';
import type { TasksState, Task, TaskFormValues, FilterState, SortState } from '@/types/task';

const STORAGE_KEY = 'taskflow_tasks';

const defaultState: TasksState = {
  tasks: [],
  filter: { status: '', priority: '' },
  sort: { sortBy: 'createdAt', sortOrder: 'desc' },
};

function loadFromStorage(): TasksState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<TasksState>;
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      filter: defaultState.filter,
      sort: parsed.sort ?? defaultState.sort,
    };
  } catch {
    return defaultState;
  }
}

function saveToStorage(state: TasksState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: state.tasks, sort: state.sort }));
  } catch {
    // localStorage unavailable or quota exceeded — silently continue
  }
}

interface TaskContextValue {
  state: TasksState;
  dispatch: React.Dispatch<TaskAction>;
  addTask: (values: TaskFormValues) => void;
  updateTask: (id: string, values: TaskFormValues) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  setSort: (sort: Partial<SortState>) => void;
  clearFilters: () => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, defaultState, () => {
    // SSR-safe: start with defaults, hydrate client-side
    return defaultState;
  });

  const hydrated = useRef(false);

  // Hydrate from localStorage once on client mount
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = loadFromStorage();
    dispatch({ type: 'HYDRATE', payload: stored });
  }, []);

  // Persist on every state change (after hydration)
  useEffect(() => {
    if (!hydrated.current) return;
    saveToStorage(state);
  }, [state]);

  const addTask = useCallback(
    (values: TaskFormValues) => dispatch({ type: 'ADD_TASK', payload: values }),
    [],
  );

  const updateTask = useCallback(
    (id: string, values: TaskFormValues) =>
      dispatch({ type: 'UPDATE_TASK', payload: { id, ...values } }),
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
    (filter: Partial<FilterState>) => dispatch({ type: 'SET_FILTER', payload: filter }),
    [],
  );

  const setSort = useCallback(
    (sort: Partial<SortState>) => dispatch({ type: 'SET_SORT', payload: sort }),
    [],
  );

  const clearFilters = useCallback(() => dispatch({ type: 'CLEAR_FILTERS' }), []);

  return (
    <TaskContext.Provider
      value={{
        state,
        dispatch,
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
