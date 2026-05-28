import type { Task, TaskFormValues, FilterState, SortState, TasksState } from '@/types/task';
import { generateId } from '@/utils/taskUtils';

export type TaskAction =
  | { type: 'HYDRATE'; payload: TasksState }
  | { type: 'ADD_TASK'; payload: TaskFormValues }
  | { type: 'UPDATE_TASK'; payload: { id: string } & TaskFormValues }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'REORDER_TASKS'; payload: Task[] }
  | { type: 'SET_FILTER'; payload: Partial<FilterState> }
  | { type: 'SET_SORT'; payload: Partial<SortState> }
  | { type: 'CLEAR_FILTERS' };

export const initialState: TasksState = {
  tasks: [],
  filter: { status: '', priority: '', collection: '' },
  sort: { sortBy: 'createdAt', sortOrder: 'desc' },
};

export function taskReducer(state: TasksState, action: TaskAction): TasksState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, tasks: action.payload.tasks, sort: action.payload.sort };

    case 'ADD_TASK': {
      const task: Task = {
        id: generateId(),
        title: action.payload.title.trim(),
        description: action.payload.description.trim(),
        priority: action.payload.priority,
        status: action.payload.status,
        collection: action.payload.collection.trim(),
        createdAt: new Date().toISOString(),
        order: state.tasks.length,
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
                title: action.payload.title.trim(),
                description: action.payload.description.trim(),
                priority: action.payload.priority,
                status: action.payload.status,
                collection: action.payload.collection.trim(),
              }
            : t,
        ),
      };

    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };

    case 'REORDER_TASKS':
      return {
        ...state,
        tasks: action.payload.map((t, i) => ({ ...t, order: i })),
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
