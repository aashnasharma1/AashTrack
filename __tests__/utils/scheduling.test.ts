import { describe, expect, it } from 'vitest';
import { resolveScheduleConflicts } from '@/lib/scheduling';
import type { Task, TaskFormValues } from '@/types/task';

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Existing task',
  description: '',
  priority: 'low',
  status: 'todo',
  collection: 'work',
  createdAt: '2026-06-01T00:00:00.000Z',
  order: 0,
  startDate: '2026-06-01',
  startTime: '11:00',
  endDate: '2026-06-01',
  endTime: '12:00',
  ...overrides,
});

const incoming = (overrides: Partial<TaskFormValues> = {}): TaskFormValues => ({
  title: 'New task',
  description: '',
  priority: 'medium',
  status: 'todo',
  collection: 'work',
  startDate: '2026-06-01',
  startTime: '11:00',
  endDate: '2026-06-01',
  endTime: '12:00',
  ...overrides,
});

describe('resolveScheduleConflicts', () => {
  it('shifts lower priority tasks after the incoming task ends', () => {
    const result = resolveScheduleConflicts([task({ priority: 'low' })], incoming());

    expect(result.ok).toBe(true);
    expect(result.shiftedTasks).toEqual([
      expect.objectContaining({
        task: expect.objectContaining({ id: 'task-1' }),
        startDate: '2026-06-01',
        startTime: '12:00',
        endDate: '2026-06-01',
        endTime: '13:00',
      }),
    ]);
  });

  it('blocks equal priority overlaps', () => {
    const result = resolveScheduleConflicts(
      [task({ priority: 'medium' })],
      incoming({ priority: 'medium' }),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/another medium priority task already exists/i);
    expect(result.shiftedTasks).toEqual([]);
  });

  it('blocks lower priority incoming tasks from overlapping higher priority tasks', () => {
    const result = resolveScheduleConflicts(
      [task({ priority: 'high' })],
      incoming({ priority: 'medium' }),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/another high priority task already exists/i);
  });

  it('blocks high priority tasks from overlapping existing high priority tasks', () => {
    const result = resolveScheduleConflicts(
      [task({ priority: 'high' })],
      incoming({ priority: 'high' }),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/another high priority task already exists/i);
  });

  it('ignores the task being edited', () => {
    const result = resolveScheduleConflicts([task()], incoming(), 'task-1');

    expect(result.ok).toBe(true);
    expect(result.shiftedTasks).toEqual([]);
  });

  it('shifts lower priority cross-midnight tasks with correct dates', () => {
    const result = resolveScheduleConflicts(
      [
        task({
          priority: 'low',
          startDate: '2026-06-01',
          startTime: '23:30',
          endDate: '2026-06-02',
          endTime: '00:30',
        }),
      ],
      incoming({
        priority: 'high',
        startDate: '2026-06-01',
        startTime: '23:30',
        endDate: '2026-06-02',
        endTime: '00:30',
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.shiftedTasks[0]).toEqual(
      expect.objectContaining({
        startDate: '2026-06-02',
        startTime: '00:30',
        endDate: '2026-06-02',
        endTime: '01:30',
      }),
    );
  });

  it('moves displaced tasks to the next available free slot', () => {
    const result = resolveScheduleConflicts(
      [
        task({ id: 'low-1', priority: 'low', startTime: '12:00', endTime: '13:00' }),
        task({ id: 'busy', priority: 'high', startTime: '13:00', endTime: '13:30' }),
      ],
      incoming({
        priority: 'medium',
        startTime: '12:00',
        endTime: '13:00',
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.shiftedTasks).toEqual([
      expect.objectContaining({
        task: expect.objectContaining({ id: 'low-1' }),
        startTime: '13:30',
        endTime: '14:30',
      }),
    ]);
  });

  it('does not treat adjacent tasks as overlapping', () => {
    const result = resolveScheduleConflicts(
      [task({ startTime: '10:00', endTime: '11:00' })],
      incoming({ startTime: '11:00', endTime: '12:00' }),
    );

    expect(result.ok).toBe(true);
    expect(result.shiftedTasks).toEqual([]);
  });

  it('skips unscheduled incoming and existing tasks', () => {
    expect(
      resolveScheduleConflicts(
        [task({ startTime: undefined, endTime: undefined })],
        incoming({ startTime: undefined, endTime: undefined }),
      ),
    ).toEqual({ ok: true, shiftedTasks: [] });

    const result = resolveScheduleConflicts(
      [task({ startTime: undefined, endTime: undefined })],
      incoming(),
    );

    expect(result.ok).toBe(true);
    expect(result.shiftedTasks).toEqual([]);
  });

  it('handles cross-midnight ranges without explicit end dates', () => {
    const result = resolveScheduleConflicts(
      [task({ priority: 'low', startTime: '23:30', endTime: '00:30', endDate: undefined })],
      incoming({
        priority: 'medium',
        startTime: '23:45',
        endTime: '00:15',
        endDate: undefined,
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.shiftedTasks[0]).toEqual(
      expect.objectContaining({
        startDate: '2026-06-02',
        startTime: '00:15',
        endDate: '2026-06-02',
        endTime: '01:15',
      }),
    );
  });
});
