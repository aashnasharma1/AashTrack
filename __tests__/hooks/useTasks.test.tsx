import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { TaskProvider } from '@/context/TaskContext';
import { useTasks } from '@/hooks/useTasks';
import type { TaskFormValues } from '@/types/task';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const wrapper = ({ children }: { children: ReactNode }) => <TaskProvider>{children}</TaskProvider>;

const t = (o: Partial<TaskFormValues> = {}): TaskFormValues => ({
  title: 'Test',
  description: '',
  priority: 'medium',
  status: 'todo',
  collection: 'Work',
  ...o,
});

describe('useTasks', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    expect(result.current.tasks).toHaveLength(0);
  });

  it('adds a task', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask(t({ title: 'Buy milk', collection: 'Shopping' }));
    });
    expect(result.current.tasks[0].title).toBe('Buy milk');
    expect(result.current.tasks[0].collection).toBe('Shopping');
  });

  it('collections are Collection objects added via addCollection', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addCollection('Work');
      result.current.addCollection('Personal');
    });
    expect(result.current.collections).toHaveLength(2);
    expect(result.current.collections[0].name).toBe('Work');
    expect(result.current.collections[1].name).toBe('Personal');
    expect(result.current.collections[0].slug).toBe('work');
  });

  it('filters by collection', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask(t({ title: 'A', collection: 'Work' }));
      result.current.addTask(t({ title: 'B', collection: 'Personal' }));
      result.current.setFilter({ collection: 'Work' });
    });
    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].title).toBe('A');
    expect(result.current.isFiltered).toBe(true);
  });

  it('updates a task', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask(t());
    });
    const id = result.current.tasks[0].id;
    act(() => {
      result.current.updateTask(id, t({ title: 'Updated', status: 'done' }));
    });
    expect(result.current.tasks[0].title).toBe('Updated');
  });

  it('deletes a task', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask(t());
    });
    const id = result.current.tasks[0].id;
    act(() => {
      result.current.deleteTask(id);
    });
    expect(result.current.tasks).toHaveLength(0);
  });

  it('clears filters', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask(t({ collection: 'Work' }));
      result.current.addTask(t({ collection: 'Personal' }));
      result.current.setFilter({ collection: 'Work' });
    });
    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.filteredTasks).toHaveLength(2);
    expect(result.current.isFiltered).toBe(false);
  });

  it('reorders tasks', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask(t({ title: 'First' }));
      result.current.addTask(t({ title: 'Second' }));
    });
    const reversed = [...result.current.tasks].reverse();
    act(() => {
      result.current.reorderTasks(reversed);
    });
    expect(result.current.tasks[0].title).toBe('Second');
  });
});
