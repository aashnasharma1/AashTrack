'use client';

// Backwards-compatible re-export. The timer state now lives in a shared
// context so the dashboard widget, the navbar timer, and the history page
// all read/write the same source of truth within a tab.
export { useTimer as useTimeTracker } from '@/context/TimerContext';
export type { SessionRecord } from '@/context/TimerContext';
