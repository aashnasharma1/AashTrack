import type {
  Collection,
  Task,
  TaskFormValues,
  FilterState,
  SortState,
  TasksState,
  StatusGroup,
} from '@/types/task';
import { DEFAULT_STATUS_GROUPS } from '@/types/task';
import { generateId, toSlug, uniqueSlug } from '@/utils/taskUtils';

// Actions that modify the task state. Each action is immutable — the reducer always returns a new state.
export type TaskAction =
  | { type: 'HYDRATE'; payload: TasksState }
  // collections
  | { type: 'ADD_COLLECTION'; payload: { name: string } }
  | { type: 'DELETE_COLLECTION'; payload: string }
  // tasks
  | { type: 'ADD_TASK'; payload: TaskFormValues }
  | { type: 'UPDATE_TASK'; payload: { id: string } & TaskFormValues }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'REORDER_TASKS'; payload: Task[] }
  // status groups
  | { type: 'ADD_STATUS_GROUP'; payload: { label: string; color: string } }
  | { type: 'DELETE_STATUS_GROUP'; payload: string }
  | { type: 'REORDER_STATUS_GROUPS'; payload: StatusGroup[] }
  | { type: 'UPDATE_STATUS_GROUP'; payload: { id: string; label?: string; color?: string } }
  // filter / sort
  | { type: 'SET_FILTER'; payload: Partial<FilterState> }
  | { type: 'SET_SORT'; payload: Partial<SortState> }
  | { type: 'CLEAR_FILTERS' };

export const initialState: TasksState = {
  collections: [],
  statusGroups: DEFAULT_STATUS_GROUPS,
  tasks: [],
  filter: { status: '', priority: '', collection: '' },
  sort: { sortBy: 'createdAt', sortOrder: 'desc' },
};

function normalizeTaskFields(values: TaskFormValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    priority: values.priority,
    status: values.status,
    collection: values.collection.trim(),
    startTime: values.startTime || undefined,
    endTime: values.endTime || undefined,
    startDate: values.startDate || undefined,
    endDate: values.endDate || undefined,
    recurring: values.recurring || undefined,
    recurrence: values.recurrence || undefined,
  };
}

export function taskReducer(state: TasksState, action: TaskAction): TasksState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        collections: action.payload.collections ?? [],
        statusGroups:
          Array.isArray(action.payload.statusGroups) && action.payload.statusGroups.length > 0
            ? action.payload.statusGroups
            : DEFAULT_STATUS_GROUPS,
        tasks: action.payload.tasks,
        sort: action.payload.sort,
      };

    // ── Collections ───────────────────────────────────────────────────────────
    case 'ADD_COLLECTION': {
      const name = action.payload.name.trim();
      const existingSlugs = state.collections.map((c) => c.slug);
      const slug = uniqueSlug(toSlug(name), existingSlugs);
      const collection: Collection = {
        id: generateId(),
        name,
        slug,
        createdAt: new Date().toISOString(),
      };
      return { ...state, collections: [...state.collections, collection] };
    }

    case 'DELETE_COLLECTION': {
      const col = state.collections.find((c) => c.id === action.payload);
      return {
        ...state,
        collections: state.collections.filter((c) => c.id !== action.payload),
        tasks: col ? state.tasks.filter((t) => t.collection !== col.slug) : state.tasks,
      };
    }

    // ── Tasks ─────────────────────────────────────────────────────────────────
    case 'ADD_TASK': {
      const task: Task = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        order: state.tasks.length,
        ...normalizeTaskFields(action.payload),
      };
      return { ...state, tasks: [...state.tasks, task] };
    }

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id
            ? {
                ...t,
                ...normalizeTaskFields(action.payload),
              }
            : t,
        ),
      };

    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };

    case 'REORDER_TASKS':
      return { ...state, tasks: action.payload.map((t, i) => ({ ...t, order: i })) };

    // ── Status groups ─────────────────────────────────────────────────────────
    case 'ADD_STATUS_GROUP': {
      const newGroup: StatusGroup = {
        id: `grp_${generateId()}`,
        label: action.payload.label.trim(),
        color: action.payload.color,
        isDefault: false,
      };
      return { ...state, statusGroups: [...state.statusGroups, newGroup] };
    }

    case 'DELETE_STATUS_GROUP':
      return {
        ...state,
        statusGroups: state.statusGroups.filter((g) => g.id !== action.payload),
      };

    case 'REORDER_STATUS_GROUPS':
      return { ...state, statusGroups: action.payload };

    case 'UPDATE_STATUS_GROUP':
      return {
        ...state,
        statusGroups: state.statusGroups.map((g) =>
          g.id === action.payload.id
            ? {
                ...g,
                ...(action.payload.label !== undefined && { label: action.payload.label }),
                ...(action.payload.color !== undefined && { color: action.payload.color }),
              }
            : g,
        ),
      };

    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };

    case 'SET_SORT':
      return { ...state, sort: { ...state.sort, ...action.payload } };

    case 'CLEAR_FILTERS':
      return { ...state, filter: { status: '', priority: '', collection: '' } };

    default:
      return state;
  }
}
