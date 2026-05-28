import type {
  Task,
  TaskFormValues,
  FilterState,
  SortState,
  TasksState,
  DurationMinutes,
} from '@/types/task';
import { generateId } from '@/utils/taskUtils';
import { buildTaskTiming, applyPriorityInterrupt, deriveStatus } from '@/utils/scheduleUtils';

export type TaskAction =
  | { type: 'HYDRATE'; payload: TasksState }
  | { type: 'ADD_TASK'; payload: TaskFormValues }
  | { type: 'UPDATE_TASK'; payload: { id: string } & TaskFormValues }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'REORDER_TASKS'; payload: Task[] }
  | { type: 'SET_FILTER'; payload: Partial<FilterState> }
  | { type: 'SET_SORT'; payload: Partial<SortState> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'REFRESH_OVERDUE' };

export const initialState: TasksState = {
  tasks: [],
  filter: { status: '', priority: '' },
  sort: { sortBy: 'startTime', sortOrder: 'asc' },
};

export function taskReducer(state: TasksState, action: TaskAction): TasksState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        tasks: action.payload.tasks,
        sort: action.payload.sort,
      };

    case 'ADD_TASK': {
      const duration = action.payload.duration as DurationMinutes;
      const timing = buildTaskTiming(action.payload.startTime, duration);
      const newTask: Task = {
        id: generateId(),
        title: action.payload.title.trim(),
        description: action.payload.description.trim(),
        priority: action.payload.priority,
        status: action.payload.status,
        createdAt: new Date().toISOString(),
        order: state.tasks.length,
        duration,
        ...timing,
      };

      // Apply priority interrupt: may update existing tasks' end times
      const updatedExisting = applyPriorityInterrupt(state.tasks, newTask);

      return { ...state, tasks: [...updatedExisting, newTask] };
    }

    case 'UPDATE_TASK': {
      const { id, ...values } = action.payload;
      const updDuration = values.duration as DurationMinutes;
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== id) return t;
          const timing = buildTaskTiming(values.startTime, updDuration);
          return {
            ...t,
            title: values.title.trim(),
            description: values.description.trim(),
            priority: values.priority,
            status: values.status,
            duration: updDuration,
            ...timing,
          };
        }),
      };
    }

    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };

    case 'REORDER_TASKS':
      return {
        ...state,
        tasks: action.payload.map((t, index) => ({ ...t, order: index })),
      };

    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };

    case 'SET_SORT':
      return { ...state, sort: { ...state.sort, ...action.payload } };

    case 'CLEAR_FILTERS':
      return { ...state, filter: { status: '', priority: '' } };

    // Called periodically to flip status to 'overdue' where applicable
    case 'REFRESH_OVERDUE':
      return {
        ...state,
        tasks: state.tasks.map((t) => ({
          ...t,
          status: deriveStatus(t),
        })),
      };

    default:
      return state;
  }
}
