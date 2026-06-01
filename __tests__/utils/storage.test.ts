import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { readStorage, writeStorage } from '@/lib/storage';

describe('storage helpers', () => {
  const schema = z.object({
    name: z.string(),
    count: z.number(),
  });

  it('reads and validates stored JSON', () => {
    localStorage.setItem('valid', JSON.stringify({ name: 'Focus', count: 3 }));

    expect(readStorage('valid', schema, { name: 'Fallback', count: 0 })).toEqual({
      name: 'Focus',
      count: 3,
    });
  });

  it('falls back for missing, malformed, or schema-invalid values', () => {
    const fallback = { name: 'Fallback', count: 0 };
    localStorage.setItem('malformed', '{');
    localStorage.setItem('invalid', JSON.stringify({ name: 'Focus', count: '3' }));

    expect(readStorage('missing', schema, fallback)).toBe(fallback);
    expect(readStorage('malformed', schema, fallback)).toBe(fallback);
    expect(readStorage('invalid', schema, fallback)).toBe(fallback);
  });

  it('ignores storage write failures', () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        setItem: () => {
          throw new Error('quota exceeded');
        },
      },
      configurable: true,
    });

    expect(() => writeStorage('blocked', { ok: true })).not.toThrow();

    Object.defineProperty(globalThis, 'localStorage', {
      value: original,
      configurable: true,
    });
  });
});
