import { describe, it, expect } from 'vitest';
import { taskReducer, initialState } from '@/lib/taskReducer';
import type { TasksState, TaskFormValues } from '@/types/task';

const makeState = (o: Partial<TasksState> = {}): TasksState => ({ ...initialState, ...o });

const p = (o: Partial<TaskFormValues> = {}): TaskFormValues => ({
  title: 'Test',
  description: '',
  priority: 'medium',
  status: 'todo',
  collection: 'Work',
  ...o,
});

describe('taskReducer', () => {
  describe('ADD_TASK', () => {
    it('adds task with id, createdAt, collection', () => {
      const s = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: p({ title: 'Buy milk', collection: 'Shopping' }),
      });
      expect(s.tasks).toHaveLength(1);
      expect(s.tasks[0].title).toBe('Buy milk');
      expect(s.tasks[0].collection).toBe('Shopping');
      expect(s.tasks[0].id).toBeDefined();
      expect(s.tasks[0].createdAt).toBeDefined();
    });
    it('trims whitespace', () => {
      const s = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: p({ title: '  trim  ', collection: '  Work  ' }),
      });
      expect(s.tasks[0].title).toBe('trim');
      expect(s.tasks[0].collection).toBe('Work');
    });
  });

  describe('UPDATE_TASK', () => {
    it('updates fields', () => {
      const base = taskReducer(makeState(), { type: 'ADD_TASK', payload: p() });
      const id = base.tasks[0].id;
      const updated = taskReducer(base, {
        type: 'UPDATE_TASK',
        payload: {
          id,
          ...p({ title: 'Updated', priority: 'high', status: 'done', collection: 'Personal' }),
        },
      });
      expect(updated.tasks[0].title).toBe('Updated');
      expect(updated.tasks[0].collection).toBe('Personal');
    });
    it('does not touch other tasks', () => {
      let s = taskReducer(makeState(), { type: 'ADD_TASK', payload: p({ title: 'A' }) });
      s = taskReducer(s, { type: 'ADD_TASK', payload: p({ title: 'B' }) });
      const id = s.tasks[0].id;
      s = taskReducer(s, { type: 'UPDATE_TASK', payload: { id, ...p({ title: 'X' }) } });
      expect(s.tasks[1].title).toBe('B');
    });
  });

  describe('DELETE_TASK', () => {
    it('removes task', () => {
      const s = taskReducer(makeState(), { type: 'ADD_TASK', payload: p() });
      const after = taskReducer(s, { type: 'DELETE_TASK', payload: s.tasks[0].id });
      expect(after.tasks).toHaveLength(0);
    });
  });

  describe('REORDER_TASKS', () => {
    it('updates order indices', () => {
      let s = taskReducer(makeState(), { type: 'ADD_TASK', payload: p({ title: 'A' }) });
      s = taskReducer(s, { type: 'ADD_TASK', payload: p({ title: 'B' }) });
      const reversed = [...s.tasks].reverse();
      const r = taskReducer(s, { type: 'REORDER_TASKS', payload: reversed });
      expect(r.tasks[0].title).toBe('B');
      expect(r.tasks[0].order).toBe(0);
    });
  });

  describe('SET_FILTER / CLEAR_FILTERS', () => {
    it('sets and clears filters', () => {
      let s = taskReducer(makeState(), {
        type: 'SET_FILTER',
        payload: { status: 'todo', collection: 'Work' },
      });
      expect(s.filter.status).toBe('todo');
      expect(s.filter.collection).toBe('Work');
      s = taskReducer(s, { type: 'CLEAR_FILTERS' });
      expect(s.filter.status).toBe('');
      expect(s.filter.collection).toBe('');
    });
  });

  describe('SET_SORT', () => {
    it('updates sort', () => {
      const s = taskReducer(makeState(), {
        type: 'SET_SORT',
        payload: { sortBy: 'priority', sortOrder: 'asc' },
      });
      expect(s.sort.sortBy).toBe('priority');
    });
  });
});
