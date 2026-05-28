import type { Task, FilterState, SortState, Priority } from '@/types/task';
import { PRIORITY_ORDER } from '@/types/task';

export function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function filterTasks(tasks: Task[], filter: FilterState): Task[] {
  return tasks.filter((task) => {
    if (filter.status && task.status !== filter.status) return false;
    if (filter.priority && task.priority !== filter.priority) return false;
    return true;
  });
}

export function sortTasks(tasks: Task[], sort: SortState): Task[] {
  return [...tasks].sort((a, b) => {
    const { sortBy, sortOrder } = sort;
    const dir = sortOrder === 'asc' ? 1 : -1;

    if (sortBy === 'createdAt') {
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    }

    if (sortBy === 'priority') {
      return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir;
    }

    if (sortBy === 'title') {
      return a.title.localeCompare(b.title) * dir;
    }

    return (a.order - b.order) * dir;
  });
}

export function filterAndSortTasks(tasks: Task[], filter: FilterState, sort: SortState): Task[] {
  return sortTasks(filterTasks(tasks, filter), sort);
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeDate(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(isoString);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function countTasksByStatus(tasks: Task[]): Record<string, number> {
  return tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1;
    return acc;
  }, {});
}

export function getPriorityWeight(priority: Priority): number {
  return PRIORITY_ORDER[priority];
}

export function hasActiveFilters(filter: FilterState): boolean {
  return filter.status !== '' || filter.priority !== '';
}
