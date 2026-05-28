// ─── Core enums ───────────────────────────────────────────────────────────────

export const PRIORITY = { low: 'low', medium: 'medium', high: 'high' } as const;
export const STATUS = { todo: 'todo', 'in-progress': 'in-progress', done: 'done' } as const;
export const SORT_BY = { createdAt: 'createdAt', priority: 'priority', title: 'title' } as const;
export const SORT_ORDER = { asc: 'asc', desc: 'desc' } as const;

export type Priority = keyof typeof PRIORITY;
export type Status = keyof typeof STATUS;
export type SortBy = keyof typeof SORT_BY;
export type SortOrder = keyof typeof SORT_ORDER;

// ─── Task — exactly what the PDF specifies ────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  order: number;
  /** Optional collection label — groups tasks without hierarchy */
  collection: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  collection: string;
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

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};
