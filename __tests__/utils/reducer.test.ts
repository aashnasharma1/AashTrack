import { describe, it, expect } from 'vitest';
import { taskReducer, initialState } from '@/lib/taskReducer';
import type { TasksState, TaskFormValues } from '@/types/task';

const makeState = (overrides: Partial<TasksState> = {}): TasksState => ({
  ...initialState,
  ...overrides,
});

const basePayload = (overrides: Partial<TaskFormValues> = {}): TaskFormValues => ({
  title: 'Test task',
  description: '',
  priority: 'medium',
  status: 'todo',
  startTime: new Date().toISOString(),
  duration: 30,
  ...overrides,
});

describe('taskReducer', () => {
  describe('ADD_TASK', () => {
    it('adds a task with generated id and createdAt', () => {
      const state = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: basePayload({ title: 'Test task', priority: 'high' }),
      });
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].title).toBe('Test task');
      expect(state.tasks[0].id).toBeDefined();
      expect(state.tasks[0].createdAt).toBeDefined();
      expect(state.tasks[0].effectiveEndTime).toBeDefined();
    });

    it('trims whitespace from title and description', () => {
      const state = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: basePayload({
          title: '  trimmed  ',
          description: '  desc  ',
          priority: 'low',
          status: 'done',
        }),
      });
      expect(state.tasks[0].title).toBe('trimmed');
      expect(state.tasks[0].description).toBe('desc');
    });

    it('sets effectiveEndTime = startTime + duration', () => {
      const start = new Date('2024-06-01T10:00:00.000Z').toISOString();
      const state = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: basePayload({ startTime: start, duration: 60 }),
      });
      const expected = new Date('2024-06-01T11:00:00.000Z').toISOString();
      expect(state.tasks[0].effectiveEndTime).toBe(expected);
    });
  });

  describe('UPDATE_TASK', () => {
    it('updates matching task fields', () => {
      const base = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: basePayload({ title: 'Original', priority: 'low' }),
      });
      const taskId = base.tasks[0].id;
      const updated = taskReducer(base, {
        type: 'UPDATE_TASK',
        payload: {
          id: taskId,
          ...basePayload({
            title: 'Updated',
            description: 'new desc',
            priority: 'high',
            status: 'done',
          }),
        },
      });
      expect(updated.tasks[0].title).toBe('Updated');
      expect(updated.tasks[0].priority).toBe('high');
      expect(updated.tasks[0].status).toBe('done');
    });

    it('does not change other tasks', () => {
      let state = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: basePayload({ title: 'Task 1', priority: 'low' }),
      });
      state = taskReducer(state, {
        type: 'ADD_TASK',
        payload: basePayload({ title: 'Task 2', priority: 'medium', status: 'in-progress' }),
      });
      const id1 = state.tasks[0].id;
      const updated = taskReducer(state, {
        type: 'UPDATE_TASK',
        payload: {
          id: id1,
          ...basePayload({ title: 'Changed', priority: 'high', status: 'done' }),
        },
      });
      expect(updated.tasks[1].title).toBe('Task 2');
    });
  });

  describe('DELETE_TASK', () => {
    it('removes the task by id', () => {
      const state = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: basePayload({ title: 'Delete me' }),
      });
      const id = state.tasks[0].id;
      const after = taskReducer(state, { type: 'DELETE_TASK', payload: id });
      expect(after.tasks).toHaveLength(0);
    });

    it('does not affect other tasks', () => {
      let state = makeState();
      state = taskReducer(state, {
        type: 'ADD_TASK',
        payload: basePayload({ title: 'Keep', priority: 'medium' }),
      });
      state = taskReducer(state, {
        type: 'ADD_TASK',
        payload: basePayload({ title: 'Delete', priority: 'low', status: 'done' }),
      });
      const deleteId = state.tasks[1].id;
      const after = taskReducer(state, { type: 'DELETE_TASK', payload: deleteId });
      expect(after.tasks).toHaveLength(1);
      expect(after.tasks[0].title).toBe('Keep');
    });
  });

  describe('SET_FILTER', () => {
    it('sets filter fields', () => {
      const state = taskReducer(makeState(), {
        type: 'SET_FILTER',
        payload: { status: 'todo' },
      });
      expect(state.filter.status).toBe('todo');
      expect(state.filter.priority).toBe('');
    });
  });

  describe('CLEAR_FILTERS', () => {
    it('resets all filters', () => {
      let state = taskReducer(makeState(), {
        type: 'SET_FILTER',
        payload: { status: 'done', priority: 'high' },
      });
      state = taskReducer(state, { type: 'CLEAR_FILTERS' });
      expect(state.filter.status).toBe('');
      expect(state.filter.priority).toBe('');
    });
  });

  describe('SET_SORT', () => {
    it('updates sort fields', () => {
      const state = taskReducer(makeState(), {
        type: 'SET_SORT',
        payload: { sortBy: 'priority', sortOrder: 'asc' },
      });
      expect(state.sort.sortBy).toBe('priority');
      expect(state.sort.sortOrder).toBe('asc');
    });
  });

  describe('REORDER_TASKS', () => {
    it('updates task order indices', () => {
      let state = makeState();
      state = taskReducer(state, {
        type: 'ADD_TASK',
        payload: basePayload({ title: 'A', priority: 'low' }),
      });
      state = taskReducer(state, {
        type: 'ADD_TASK',
        payload: basePayload({ title: 'B', priority: 'low' }),
      });
      const reversed = [...state.tasks].reverse();
      const reordered = taskReducer(state, { type: 'REORDER_TASKS', payload: reversed });
      expect(reordered.tasks[0].title).toBe('B');
      expect(reordered.tasks[0].order).toBe(0);
      expect(reordered.tasks[1].title).toBe('A');
      expect(reordered.tasks[1].order).toBe(1);
    });
  });
});
