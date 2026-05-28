import { describe, it, expect } from 'vitest';
import { taskSchema, TITLE_MAX, DESCRIPTION_MAX } from '@/lib/validation';

describe('taskSchema', () => {
  const validInput = {
    title: 'Fix the login bug',
    description: 'Users cannot log in with Google SSO',
    priority: 'high' as const,
    status: 'todo' as const,
  };

  it('accepts a fully valid task', () => {
    const result = taskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts a task with no description', () => {
    const result = taskSchema.safeParse({ ...validInput, description: '' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = taskSchema.safeParse({ ...validInput, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it('rejects whitespace-only title', () => {
    const result = taskSchema.safeParse({ ...validInput, title: '   ' });
    expect(result.success).toBe(false);
  });

  it(`rejects title exceeding ${TITLE_MAX} characters`, () => {
    const result = taskSchema.safeParse({
      ...validInput,
      title: 'a'.repeat(TITLE_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it(`rejects description exceeding ${DESCRIPTION_MAX} characters`, () => {
    const result = taskSchema.safeParse({
      ...validInput,
      description: 'a'.repeat(DESCRIPTION_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid priority', () => {
    const result = taskSchema.safeParse({ ...validInput, priority: 'urgent' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = taskSchema.safeParse({ ...validInput, status: 'blocked' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid priority values', () => {
    (['low', 'medium', 'high'] as const).forEach((priority) => {
      const result = taskSchema.safeParse({ ...validInput, priority });
      expect(result.success).toBe(true);
    });
  });

  it('accepts all valid status values', () => {
    (['todo', 'in-progress', 'done'] as const).forEach((status) => {
      const result = taskSchema.safeParse({ ...validInput, status });
      expect(result.success).toBe(true);
    });
  });
});
