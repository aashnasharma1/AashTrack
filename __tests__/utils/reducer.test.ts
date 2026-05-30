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

    it('stores optional start and end times', () => {
      const s = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: p({ startTime: '09:00', endTime: '10:30' }),
      });
      expect(s.tasks[0].startTime).toBe('09:00');
      expect(s.tasks[0].endTime).toBe('10:30');
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

    it('clears optional time values when empty strings are submitted', () => {
      const base = taskReducer(makeState(), {
        type: 'ADD_TASK',
        payload: p({ startTime: '09:00', endTime: '10:00' }),
      });
      const id = base.tasks[0].id;
      const updated = taskReducer(base, {
        type: 'UPDATE_TASK',
        payload: { id, ...p({ startTime: '', endTime: '' }) },
      });
      expect(updated.tasks[0].startTime).toBeUndefined();
      expect(updated.tasks[0].endTime).toBeUndefined();
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

  describe('collections', () => {
    it('adds unique slugs and deletes associated tasks', () => {
      let s = taskReducer(makeState(), { type: 'ADD_COLLECTION', payload: { name: 'Work' } });
      s = taskReducer(s, { type: 'ADD_COLLECTION', payload: { name: 'Work' } });
      s = taskReducer(s, { type: 'ADD_TASK', payload: p({ title: 'A', collection: 'work' }) });
      s = taskReducer(s, { type: 'ADD_TASK', payload: p({ title: 'B', collection: 'personal' }) });

      expect(s.collections.map((c) => c.slug)).toEqual(['work', 'work-2']);

      const after = taskReducer(s, { type: 'DELETE_COLLECTION', payload: s.collections[0].id });
      expect(after.collections).toHaveLength(1);
      expect(after.tasks.map((t) => t.title)).toEqual(['B']);
    });

    it('leaves tasks unchanged when deleting an unknown collection', () => {
      const s = taskReducer(makeState(), { type: 'ADD_TASK', payload: p({ title: 'A' }) });
      const after = taskReducer(s, { type: 'DELETE_COLLECTION', payload: 'missing' });
      expect(after.tasks).toHaveLength(1);
    });
  });

  describe('status groups', () => {
    it('adds, updates, reorders, and deletes status groups', () => {
      let s = taskReducer(makeState(), {
        type: 'ADD_STATUS_GROUP',
        payload: { label: 'Blocked', color: '#111111' },
      });
      const blocked = s.statusGroups.at(-1)!;
      expect(blocked.label).toBe('Blocked');
      expect(blocked.isDefault).toBe(false);

      s = taskReducer(s, {
        type: 'UPDATE_STATUS_GROUP',
        payload: { id: blocked.id, label: 'Waiting', color: '#222222' },
      });
      expect(s.statusGroups.at(-1)).toMatchObject({ label: 'Waiting', color: '#222222' });

      const reversed = [...s.statusGroups].reverse();
      s = taskReducer(s, { type: 'REORDER_STATUS_GROUPS', payload: reversed });
      expect(s.statusGroups[0].label).toBe('Waiting');

      s = taskReducer(s, { type: 'DELETE_STATUS_GROUP', payload: blocked.id });
      expect(s.statusGroups.some((g) => g.id === blocked.id)).toBe(false);
    });
  });

  describe('HYDRATE', () => {
    it('hydrates persisted state and falls back to default status groups when missing', () => {
      const s = taskReducer(makeState({ statusGroups: [] }), {
        type: 'HYDRATE',
        payload: {
          collections: [],
          statusGroups: [],
          tasks: [],
          filter: { status: 'done', priority: 'high', collection: 'work' },
          sort: { sortBy: 'title', sortOrder: 'asc' },
        },
      });

      expect(s.statusGroups).toEqual(initialState.statusGroups);
      expect(s.filter).toEqual(initialState.filter);
      expect(s.sort.sortBy).toBe('title');
    });
  });
});
