// ─── Core enums ───────────────────────────────────────────────────────────────

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export const PRIORITY = { low: 'low', medium: 'medium', high: 'high' } as const;
export const SORT_BY_OPTIONS = ['createdAt', 'priority', 'title', 'manual'] as const;
export const SORT_BY = {
  createdAt: 'createdAt',
  priority: 'priority',
  title: 'title',
  manual: 'manual',
} as const;
export const SORT_ORDER_OPTIONS = ['asc', 'desc'] as const;
export const SORT_ORDER = { asc: 'asc', desc: 'desc' } as const;

export type Priority = (typeof PRIORITIES)[number];
export type Status = string; // relaxed to string to support custom status groups
export type SortBy = (typeof SORT_BY_OPTIONS)[number];
export type SortOrder = (typeof SORT_ORDER_OPTIONS)[number];

export function isPriority(value: unknown): value is Priority {
  return PRIORITIES.some((priority) => priority === value);
}

// ─── Status group ─────────────────────────────────────────────────────────────

export interface StatusGroup {
  id: string;
  label: string;
  color: string; // hex e.g. '#f43f5e'
  isDefault: boolean;
}

export const DEFAULT_STATUS_GROUPS: StatusGroup[] = [
  { id: 'todo', label: 'To Do', color: '#f43f5e', isDefault: true },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6', isDefault: true },
  { id: 'done', label: 'Done', color: '#10b1', isDefault: true },
];

// ─── Collection — first-class entity ─────────────────────────────────────────

export interface Collection {
  id: string;
  name: string;
  /** URL-safe slug derived from name, e.g. "personal-tasks" */
  slug: string;
  createdAt: string;
}

// ─── Recurrence ───────────────────────────────────────────────────────────────

export type RepeatFreq = 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom';

export interface TaskRecurrence {
  frequency: RepeatFreq;
  customDays: number[]; // 0=Sun … 6=Sat; only for frequency='custom'
  occurrences: number; // how many times this task repeats
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  order: number;
  /** slug of the collection this task belongs to */
  collection: string;
  /** "HH:MM" 24-hour time string, e.g. "09:30" */
  startTime?: string;
  endTime?: string;
  /** "YYYY-MM-DD" date — optional. When absent the task is treated as "today". */
  startDate?: string;
  endDate?: string;
  /** true when the task was created as part of a recurring series */
  recurring?: boolean;
  /** recurrence config stored on the task */
  recurrence?: TaskRecurrence;
}

export interface TaskFormValues {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  collection: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  recurring?: boolean;
  recurrence?: TaskRecurrence;
}

/** Partial update applied to an existing task via inline editors. */
export interface TaskPatch {
  title?: string;
  priority?: Priority;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
}

// ─── Filter / sort state ──────────────────────────────────────────────────────

export interface FilterState {
  status: Status | '';
  priority: Priority | '';
  collection: string;
}

export interface SortState {
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export interface TasksState {
  collections: Collection[];
  statusGroups: StatusGroup[];
  tasks: Task[];
  filter: FilterState;
  sort: SortState;
}

// ─── Label maps ───────────────────────────────────────────────────────────────

export const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};
