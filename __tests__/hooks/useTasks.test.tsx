import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { TaskProvider } from '@/context/TaskContext';
import { useTasks } from '@/hooks/useTasks';
import type { TaskFormValues } from '@/types/task';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const wrapper = ({ children }: { children: ReactNode }) => <TaskProvider>{children}</TaskProvider>;

const task = (overrides: Partial<TaskFormValues> = {}): TaskFormValues => ({
  title: 'Test',
  description: '',
  priority: 'medium',
  status: 'todo',
  startTime: new Date().toISOString(),
  duration: 30,
  ...overrides,
});

describe('useTasks', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('starts with empty tasks', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    expect(result.current.tasks).toHaveLength(0);
    expect(result.current.filteredTasks).toHaveLength(0);
  });

  it('adds a task', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask(task({ title: 'Test task', priority: 'high' }));
    });
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Test task');
    expect(result.current.tasks[0].priority).toBe('high');
    expect(result.current.tasks[0].effectiveEndTime).toBeDefined();
  });

  it('updates a task', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask(task({ title: 'Original', priority: 'low' }));
    });
    const id = result.current.tasks[0].id;
    act(() => {
      result.current.updateTask(
        id,
        task({ title: 'Updated', description: 'new', priority: 'high', status: 'done' }),
      );
    });
    expect(result.current.tasks[0].title).toBe('Updated');
    expect(result.current.tasks[0].status).toBe('done');
  });

  it('deletes a task', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask(task({ title: 'Delete me' }));
    });
    const id = result.current.tasks[0].id;
    act(() => {
      result.current.deleteTask(id);
    });
    expect(result.current.tasks).toHaveLength(0);
  });

  it('filters tasks by status', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask(task({ title: 'Todo task', priority: 'high', status: 'todo' }));
      result.current.addTask(task({ title: 'Done task', priority: 'low', status: 'done' }));
    });
    act(() => {
      result.current.setFilter({ status: 'todo' });
    });
    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].title).toBe('Todo task');
    expect(result.current.isFiltered).toBe(true);
  });

  it('clears filters', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask(task({ title: 'Task 1', priority: 'high', status: 'todo' }));
      result.current.addTask(task({ title: 'Task 2', priority: 'low', status: 'done' }));
      result.current.setFilter({ status: 'todo' });
    });
    expect(result.current.filteredTasks).toHaveLength(1);
    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.filteredTasks).toHaveLength(2);
    expect(result.current.isFiltered).toBe(false);
  });

  it('reorders tasks', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask(task({ title: 'First', priority: 'low' }));
      result.current.addTask(task({ title: 'Second', priority: 'low' }));
    });
    const reversed = [...result.current.tasks].reverse();
    act(() => {
      result.current.reorderTasks(reversed);
    });
    expect(result.current.tasks[0].title).toBe('Second');
  });

  it('sets sort state', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.setSort({ sortBy: 'priority', sortOrder: 'asc' });
    });
    expect(result.current.sort.sortBy).toBe('priority');
    expect(result.current.sort.sortOrder).toBe('asc');
  });
});
