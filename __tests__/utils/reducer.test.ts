import { describe, it, expect } from 'vitest';
import { taskReducer, initialState } from '@/lib/taskReducer';
import type { TasksState } from '@/types/task';

const makeState = (overrides: Partial<TasksState> = {}): TasksState => ({
  ...initialState,
  ...overrides,
});

describe('taskReducer', () => {
  describe('ADD_TASK', () => {
    it('adds a task with generated id and createdAt', () => {
      const state = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: { title: 'Test task', description: '', priority: 'high', status: 'todo' },
      });
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].title).toBe('Test task');
      expect(state.tasks[0].id).toBeDefined();
      expect(state.tasks[0].createdAt).toBeDefined();
    });

    it('trims whitespace from title and description', () => {
      const state = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: { title: '  trimmed  ', description: '  desc  ', priority: 'low', status: 'done' },
      });
      expect(state.tasks[0].title).toBe('trimmed');
      expect(state.tasks[0].description).toBe('desc');
    });
  });

  describe('UPDATE_TASK', () => {
    it('updates matching task fields', () => {
      const base = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: { title: 'Original', description: '', priority: 'low', status: 'todo' },
      });
      const taskId = base.tasks[0].id;
      const updated = taskReducer(base, {
        type: 'UPDATE_TASK',
        payload: {
          id: taskId,
          title: 'Updated',
          description: 'new desc',
          priority: 'high',
          status: 'done',
        },
      });
      expect(updated.tasks[0].title).toBe('Updated');
      expect(updated.tasks[0].priority).toBe('high');
      expect(updated.tasks[0].status).toBe('done');
    });

    it('does not change other tasks', () => {
      let state = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: { title: 'Task 1', description: '', priority: 'low', status: 'todo' },
      });
      state = taskReducer(state, {
        type: 'ADD_TASK',
        payload: { title: 'Task 2', description: '', priority: 'medium', status: 'in-progress' },
      });
      const id1 = state.tasks[0].id;
      const updated = taskReducer(state, {
        type: 'UPDATE_TASK',
        payload: { id: id1, title: 'Changed', description: '', priority: 'high', status: 'done' },
      });
      expect(updated.tasks[1].title).toBe('Task 2');
    });
  });

  describe('DELETE_TASK', () => {
    it('removes the task by id', () => {
      const state = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: { title: 'Delete me', description: '', priority: 'low', status: 'todo' },
      });
      const id = state.tasks[0].id;
      const after = taskReducer(state, { type: 'DELETE_TASK', payload: id });
      expect(after.tasks).toHaveLength(0);
    });

    it('does not affect other tasks', () => {
      let state = makeState();
      state = taskReducer(state, {
        type: 'ADD_TASK',
        payload: { title: 'Keep', description: '', priority: 'medium', status: 'todo' },
      });
      state = taskReducer(state, {
        type: 'ADD_TASK',
        payload: { title: 'Delete', description: '', priority: 'low', status: 'done' },
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
        payload: { title: 'A', description: '', priority: 'low', status: 'todo' },
      });
      state = taskReducer(state, {
        type: 'ADD_TASK',
        payload: { title: 'B', description: '', priority: 'low', status: 'todo' },
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
