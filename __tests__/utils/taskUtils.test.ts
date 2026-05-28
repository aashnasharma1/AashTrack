import { describe, it, expect } from 'vitest';
import {
  generateId,
  filterTasks,
  sortTasks,
  filterAndSortTasks,
  formatDate,
  formatRelativeDate,
  truncate,
  countTasksByStatus,
  hasActiveFilters,
} from '@/utils/taskUtils';
import type { Task, FilterState, SortState } from '@/types/task';

const makeTasks = (): Task[] => [
  {
    id: '1',
    title: 'High priority todo',
    description: 'A high priority task',
    priority: 'high',
    status: 'todo',
    createdAt: '2024-01-01T10:00:00.000Z',
    order: 0,
  },
  {
    id: '2',
    title: 'Medium in-progress',
    description: '',
    priority: 'medium',
    status: 'in-progress',
    createdAt: '2024-01-02T10:00:00.000Z',
    order: 1,
  },
  {
    id: '3',
    title: 'Low done',
    description: 'Done task',
    priority: 'low',
    status: 'done',
    createdAt: '2024-01-03T10:00:00.000Z',
    order: 2,
  },
  {
    id: '4',
    title: 'Another todo',
    description: '',
    priority: 'high',
    status: 'todo',
    createdAt: '2024-01-04T10:00:00.000Z',
    order: 3,
  },
];

describe('generateId', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('starts with task_ prefix', () => {
    expect(generateId()).toMatch(/^task_/);
  });
});

describe('filterTasks', () => {
  const tasks = makeTasks();

  it('returns all tasks when no filter is active', () => {
    const filter: FilterState = { status: '', priority: '' };
    expect(filterTasks(tasks, filter)).toHaveLength(4);
  });

  it('filters by status', () => {
    const filter: FilterState = { status: 'todo', priority: '' };
    const result = filterTasks(tasks, filter);
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.status === 'todo')).toBe(true);
  });

  it('filters by priority', () => {
    const filter: FilterState = { status: '', priority: 'high' };
    const result = filterTasks(tasks, filter);
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.priority === 'high')).toBe(true);
  });

  it('filters by both status and priority', () => {
    const filter: FilterState = { status: 'todo', priority: 'high' };
    const result = filterTasks(tasks, filter);
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.status === 'todo' && t.priority === 'high')).toBe(true);
  });

  it('returns empty array when no tasks match', () => {
    const filter: FilterState = { status: 'done', priority: 'high' };
    expect(filterTasks(tasks, filter)).toHaveLength(0);
  });
});

describe('sortTasks', () => {
  const tasks = makeTasks();

  it('sorts by createdAt desc (newest first)', () => {
    const sort: SortState = { sortBy: 'createdAt', sortOrder: 'desc' };
    const result = sortTasks(tasks, sort);
    expect(result[0].id).toBe('4');
    expect(result[result.length - 1].id).toBe('1');
  });

  it('sorts by createdAt asc (oldest first)', () => {
    const sort: SortState = { sortBy: 'createdAt', sortOrder: 'asc' };
    const result = sortTasks(tasks, sort);
    expect(result[0].id).toBe('1');
    expect(result[result.length - 1].id).toBe('4');
  });

  it('sorts by priority desc (high first)', () => {
    const sort: SortState = { sortBy: 'priority', sortOrder: 'asc' };
    const result = sortTasks(tasks, sort);
    expect(result[0].priority).toBe('high');
    expect(result[result.length - 1].priority).toBe('low');
  });

  it('sorts by title asc', () => {
    const sort: SortState = { sortBy: 'title', sortOrder: 'asc' };
    const result = sortTasks(tasks, sort);
    expect(result[0].title).toBe('Another todo');
  });

  it('does not mutate the original array', () => {
    const original = [...tasks];
    const sort: SortState = { sortBy: 'createdAt', sortOrder: 'asc' };
    sortTasks(tasks, sort);
    expect(tasks).toEqual(original);
  });
});

describe('filterAndSortTasks', () => {
  it('applies filter and sort together', () => {
    const tasks = makeTasks();
    const filter: FilterState = { status: 'todo', priority: '' };
    const sort: SortState = { sortBy: 'createdAt', sortOrder: 'asc' };
    const result = filterAndSortTasks(tasks, filter, sort);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('4');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    const result = formatDate('2024-03-15T10:00:00.000Z');
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });
});

describe('formatRelativeDate', () => {
  it('returns "just now" for very recent dates', () => {
    const recent = new Date(Date.now() - 30_000).toISOString();
    expect(formatRelativeDate(recent)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const mins = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeDate(mins)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const hours = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(formatRelativeDate(hours)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const days = new Date(Date.now() - 2 * 86_400_000).toISOString();
    expect(formatRelativeDate(days)).toBe('2d ago');
  });
});

describe('truncate', () => {
  it('returns full string when shorter than max', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and adds ellipsis', () => {
    const result = truncate('hello world', 5);
    expect(result).toMatch(/…/);
    expect(result.length).toBeLessThanOrEqual(6);
  });

  it('returns exact length string unchanged', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

describe('countTasksByStatus', () => {
  it('counts tasks by status correctly', () => {
    const tasks = makeTasks();
    const counts = countTasksByStatus(tasks);
    expect(counts['todo']).toBe(2);
    expect(counts['in-progress']).toBe(1);
    expect(counts['done']).toBe(1);
  });

  it('returns empty object for empty tasks', () => {
    expect(countTasksByStatus([])).toEqual({});
  });
});

describe('hasActiveFilters', () => {
  it('returns false when no filters set', () => {
    expect(hasActiveFilters({ status: '', priority: '' })).toBe(false);
  });

  it('returns true when status filter set', () => {
    expect(hasActiveFilters({ status: 'todo', priority: '' })).toBe(true);
  });

  it('returns true when priority filter set', () => {
    expect(hasActiveFilters({ status: '', priority: 'high' })).toBe(true);
  });

  it('returns true when both filters set', () => {
    expect(hasActiveFilters({ status: 'done', priority: 'low' })).toBe(true);
  });
});
