import { describe, it, expect } from 'vitest';
import {
  generateId,
  filterTasks,
  sortTasks,
  filterAndSortTasks,
  formatRelativeDate,
  truncate,
  countTasksByStatus,
  hasActiveFilters,
  toSlug,
  uniqueSlug,
} from '@/utils/taskUtils';
import type { Task } from '@/types/task';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task_1',
  title: 'Test task',
  description: '',
  priority: 'medium',
  status: 'todo',
  collection: 'Work',
  createdAt: '2024-01-01T10:00:00.000Z',
  order: 0,
  ...overrides,
});

const makeTasks = (): Task[] => [
  makeTask({
    id: '1',
    title: 'High todo',
    priority: 'high',
    status: 'todo',
    collection: 'Work',
    createdAt: '2024-01-01T10:00:00.000Z',
    order: 0,
  }),
  makeTask({
    id: '2',
    title: 'Medium in-progress',
    priority: 'medium',
    status: 'in-progress',
    collection: 'Personal',
    createdAt: '2024-01-02T10:00:00.000Z',
    order: 1,
  }),
  makeTask({
    id: '3',
    title: 'Low done',
    priority: 'low',
    status: 'done',
    collection: 'Work',
    createdAt: '2024-01-03T10:00:00.000Z',
    order: 2,
  }),
  makeTask({
    id: '4',
    title: 'Another todo',
    priority: 'high',
    status: 'todo',
    collection: 'Shopping',
    createdAt: '2024-01-04T10:00:00.000Z',
    order: 3,
  }),
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
    expect(filterTasks(tasks, { status: '', priority: '', collection: '' })).toHaveLength(4);
  });
  it('filters by status', () => {
    const result = filterTasks(tasks, { status: 'todo', priority: '', collection: '' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.status === 'todo')).toBe(true);
  });
  it('filters by priority', () => {
    const result = filterTasks(tasks, { status: '', priority: 'high', collection: '' });
    expect(result).toHaveLength(2);
  });
  it('filters by collection', () => {
    const result = filterTasks(tasks, { status: '', priority: '', collection: 'Work' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.collection === 'Work')).toBe(true);
  });
  it('filters by status + priority together', () => {
    const result = filterTasks(tasks, { status: 'todo', priority: 'high', collection: '' });
    expect(result).toHaveLength(2);
  });
  it('returns empty when no match', () => {
    expect(filterTasks(tasks, { status: 'done', priority: 'high', collection: '' })).toHaveLength(
      0,
    );
  });
});

describe('sortTasks', () => {
  const tasks = makeTasks();

  it('sorts by createdAt desc (newest first)', () => {
    const result = sortTasks(tasks, { sortBy: 'createdAt', sortOrder: 'desc' });
    expect(result[0].id).toBe('4');
    expect(result[result.length - 1].id).toBe('1');
  });
  it('sorts by createdAt asc', () => {
    const result = sortTasks(tasks, { sortBy: 'createdAt', sortOrder: 'asc' });
    expect(result[0].id).toBe('1');
  });
  it('sorts by priority (high first)', () => {
    const result = sortTasks(tasks, { sortBy: 'priority', sortOrder: 'asc' });
    expect(result[0].priority).toBe('high');
    expect(result[result.length - 1].priority).toBe('low');
  });
  it('does not mutate original array', () => {
    const original = [...tasks];
    sortTasks(tasks, { sortBy: 'createdAt', sortOrder: 'asc' });
    expect(tasks).toEqual(original);
  });
});

describe('filterAndSortTasks', () => {
  it('applies filter and sort', () => {
    const tasks = makeTasks();
    const result = filterAndSortTasks(
      tasks,
      { status: 'todo', priority: '', collection: '' },
      { sortBy: 'createdAt', sortOrder: 'asc' },
    );
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
  });
});

describe('hasActiveFilters', () => {
  it('returns false when no filters', () => {
    expect(hasActiveFilters({ status: '', priority: '', collection: '' })).toBe(false);
  });
  it('returns true when status set', () => {
    expect(hasActiveFilters({ status: 'todo', priority: '', collection: '' })).toBe(true);
  });
  it('returns true when collection set', () => {
    expect(hasActiveFilters({ status: '', priority: '', collection: 'Work' })).toBe(true);
  });
});

describe('truncate', () => {
  it('returns full string when short', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });
  it('truncates and adds ellipsis', () => {
    expect(truncate('hello world', 5)).toMatch(/…/);
  });
});

describe('formatRelativeDate', () => {
  it('returns just now for recent', () => {
    expect(formatRelativeDate(new Date(Date.now() - 30_000).toISOString())).toBe('just now');
  });
  it('returns minutes ago', () => {
    expect(formatRelativeDate(new Date(Date.now() - 5 * 60_000).toISOString())).toBe('5m ago');
  });
});

describe('toSlug', () => {
  it('converts spaces to hyphens', () => {
    expect(toSlug('Mobile App 1')).toBe('mobile-app-1');
  });
  it('removes special characters', () => {
    expect(toSlug('Hello! World?')).toBe('hello-world');
  });
  it('trims and lowercases', () => {
    expect(toSlug('  WORK  ')).toBe('work');
  });
});

describe('uniqueSlug', () => {
  it('returns base if not in existing', () => {
    expect(uniqueSlug('work', ['personal'])).toBe('work');
  });
  it('appends -2 on collision', () => {
    expect(uniqueSlug('work', ['work'])).toBe('work-2');
  });
  it('appends -3 if -2 also taken', () => {
    expect(uniqueSlug('work', ['work', 'work-2'])).toBe('work-3');
  });
});

describe('countTasksByStatus', () => {
  it('counts correctly', () => {
    const tasks = makeTasks();
    const counts = countTasksByStatus(tasks);
    expect(counts['todo']).toBe(2);
    expect(counts['done']).toBe(1);
  });
});
