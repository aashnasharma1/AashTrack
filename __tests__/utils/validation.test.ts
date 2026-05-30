import { describe, it, expect } from 'vitest';
import { taskSchema, TITLE_MAX, DESCRIPTION_MAX, COLLECTION_MAX } from '@/lib/validation';

describe('taskSchema', () => {
  const valid = {
    title: 'Fix the login bug',
    description: 'Users cannot log in',
    priority: 'high' as const,
    status: 'todo' as const,
    collection: 'Work',
  };

  it('accepts a fully valid task', () => {
    expect(taskSchema.safeParse(valid).success).toBe(true);
  });
  it('accepts empty description', () => {
    expect(taskSchema.safeParse({ ...valid, description: '' }).success).toBe(true);
  });
  it('rejects empty title', () => {
    const r = taskSchema.safeParse({ ...valid, title: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toMatch(/required/i);
  });
  it('rejects whitespace-only title', () => {
    expect(taskSchema.safeParse({ ...valid, title: '   ' }).success).toBe(false);
  });
  it(`rejects title over ${TITLE_MAX} chars`, () => {
    expect(taskSchema.safeParse({ ...valid, title: 'a'.repeat(TITLE_MAX + 1) }).success).toBe(
      false,
    );
  });
  it(`rejects description over ${DESCRIPTION_MAX} chars`, () => {
    expect(
      taskSchema.safeParse({ ...valid, description: 'a'.repeat(DESCRIPTION_MAX + 1) }).success,
    ).toBe(false);
  });
  it('rejects empty collection', () => {
    expect(taskSchema.safeParse({ ...valid, collection: '' }).success).toBe(false);
  });
  it(`rejects collection over ${COLLECTION_MAX} chars`, () => {
    expect(
      taskSchema.safeParse({ ...valid, collection: 'a'.repeat(COLLECTION_MAX + 1) }).success,
    ).toBe(false);
  });
  it('rejects invalid priority', () => {
    expect(taskSchema.safeParse({ ...valid, priority: 'urgent' }).success).toBe(false);
  });
  it('accepts custom status values', () => {
    expect(taskSchema.safeParse({ ...valid, status: 'blocked' }).success).toBe(true);
  });

  it('rejects empty status', () => {
    expect(taskSchema.safeParse({ ...valid, status: '' }).success).toBe(false);
  });
  it('accepts all valid priority values', () => {
    (['low', 'medium', 'high'] as const).forEach((priority) => {
      expect(taskSchema.safeParse({ ...valid, priority }).success).toBe(true);
    });
  });
  it('accepts all valid status values', () => {
    (['todo', 'in-progress', 'done'] as const).forEach((status) => {
      expect(taskSchema.safeParse({ ...valid, status }).success).toBe(true);
    });
  });
});
