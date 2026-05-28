import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { TaskProvider } from '@/context/TaskContext';
import { useTasks } from '@/hooks/useTasks';

// Suppress localStorage errors in jsdom
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
      result.current.addTask({
        title: 'Test task',
        description: 'A description',
        priority: 'high',
        status: 'todo',
      });
    });
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Test task');
    expect(result.current.tasks[0].priority).toBe('high');
  });

  it('updates a task', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask({
        title: 'Original',
        description: '',
        priority: 'low',
        status: 'todo',
      });
    });
    const id = result.current.tasks[0].id;
    act(() => {
      result.current.updateTask(id, {
        title: 'Updated',
        description: 'new',
        priority: 'high',
        status: 'done',
      });
    });
    expect(result.current.tasks[0].title).toBe('Updated');
    expect(result.current.tasks[0].status).toBe('done');
  });

  it('deletes a task', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    act(() => {
      result.current.addTask({
        title: 'Delete me',
        description: '',
        priority: 'low',
        status: 'todo',
      });
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
      result.current.addTask({
        title: 'Todo task',
        description: '',
        priority: 'high',
        status: 'todo',
      });
      result.current.addTask({
        title: 'Done task',
        description: '',
        priority: 'low',
        status: 'done',
      });
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
      result.current.addTask({
        title: 'Task 1',
        description: '',
        priority: 'high',
        status: 'todo',
      });
      result.current.addTask({ title: 'Task 2', description: '', priority: 'low', status: 'done' });
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
      result.current.addTask({ title: 'First', description: '', priority: 'low', status: 'todo' });
      result.current.addTask({ title: 'Second', description: '', priority: 'low', status: 'todo' });
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
