// ─── Core enums ───────────────────────────────────────────────────────────────

export const PRIORITY = { low: 'low', medium: 'medium', high: 'high' } as const;
export const SORT_BY = {
  createdAt: 'createdAt',
  priority: 'priority',
  title: 'title',
  manual: 'manual',
} as const;
export const SORT_ORDER = { asc: 'asc', desc: 'desc' } as const;

export type Priority = keyof typeof PRIORITY;
export type Status = string; // relaxed to string to support custom status groups
export type SortBy = keyof typeof SORT_BY;
export type SortOrder = keyof typeof SORT_ORDER;

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
  { id: 'done', label: 'Done', color: '#10b981', isDefault: true },
];

// ─── Collection — first-class entity ─────────────────────────────────────────

export interface Collection {
  id: string;
  name: string;
  /** URL-safe slug derived from name, e.g. "personal-tasks" */
  slug: string;
  createdAt: string;
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
}

export interface TaskFormValues {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  collection: string;
  startTime?: string;
  endTime?: string;
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
