export const PRIORITY = {
  low: 'low',
  medium: 'medium',
  high: 'high',
} as const;

export const STATUS = {
  todo: 'todo',
  'in-progress': 'in-progress',
  done: 'done',
} as const;

export const SORT_BY = {
  createdAt: 'createdAt',
  priority: 'priority',
  title: 'title',
} as const;

export const SORT_ORDER = {
  asc: 'asc',
  desc: 'desc',
} as const;

export type Priority = keyof typeof PRIORITY;
export type Status = keyof typeof STATUS;
export type SortBy = keyof typeof SORT_BY;
export type SortOrder = keyof typeof SORT_ORDER;

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  order: number;
  /** Present when task belongs to a module; absent for top-level inbox tasks */
  moduleId?: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
}

export interface FilterState {
  status: Status | '';
  priority: Priority | '';
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

// ─── Project / Module hierarchy ───────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string;
  color: ProjectColor;
  createdAt: string;
}

export interface ProjectFormValues {
  name: string;
  description: string;
  color: ProjectColor;
}

export interface ProjectModule {
  id: string;
  projectId: string;
  name: string;
  description: string;
  createdAt: string;
  order: number;
}

export interface ModuleFormValues {
  name: string;
  description: string;
}

export const PROJECT_COLORS = ['indigo', 'violet', 'sky', 'emerald', 'amber', 'rose'] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

export const PROJECT_COLOR_CLASSES: Record<
  ProjectColor,
  { bg: string; text: string; ring: string; dot: string }
> = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950',
    text: 'text-indigo-700 dark:text-indigo-300',
    ring: 'ring-indigo-200 dark:ring-indigo-800',
    dot: 'bg-indigo-500',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950',
    text: 'text-violet-700 dark:text-violet-300',
    ring: 'ring-violet-200 dark:ring-violet-800',
    dot: 'bg-violet-500',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950',
    text: 'text-sky-700 dark:text-sky-300',
    ring: 'ring-sky-200 dark:ring-sky-800',
    dot: 'bg-sky-500',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
    dot: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-200 dark:ring-amber-800',
    dot: 'bg-amber-500',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950',
    text: 'text-rose-700 dark:text-rose-300',
    ring: 'ring-rose-200 dark:ring-rose-800',
    dot: 'bg-rose-500',
  },
};

// ─── Shared label maps ─────────────────────────────────────────────────────────

export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

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
