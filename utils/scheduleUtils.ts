import type { Task, DurationMinutes, Priority } from '@/types/task';
import { DURATION_LABELS, PRIORITY_ORDER } from '@/types/task';

// ─── Time helpers ─────────────────────────────────────────────────────────────

export function addMinutes(isoDate: string, minutes: number): string {
  return new Date(new Date(isoDate).getTime() + minutes * 60_000).toISOString();
}

export function minutesBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Format ISO datetime as "HH:MM" in local time */
export function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Format ISO datetime as "DD MMM, HH:MM" */
export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(minutes: DurationMinutes): string {
  return DURATION_LABELS[minutes];
}

// ─── Overdue ──────────────────────────────────────────────────────────────────

export function isOverdue(task: Task): boolean {
  if (task.status === 'done') return false;
  return new Date(task.effectiveEndTime) < new Date();
}

/** Minutes remaining until end time. Negative means overdue. */
export function minutesRemaining(task: Task): number {
  return minutesBetween(nowIso(), task.effectiveEndTime);
}

export function formatRemaining(task: Task): string {
  const mins = minutesRemaining(task);
  if (mins <= 0) {
    const over = Math.abs(mins);
    if (over < 60) return `${over}m overdue`;
    return `${Math.floor(over / 60)}h ${over % 60}m overdue`;
  }
  if (mins < 60) return `${mins}m left`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m left` : `${h}h left`;
}

// ─── Priority interrupt ───────────────────────────────────────────────────────

/**
 * When a new task is added, check if it has higher priority than any currently
 * running (non-done, non-overdue) task. If so:
 *  1. The interrupted task's remaining minutes are stored.
 *  2. The interrupted task's effectiveEndTime is pushed out to after the new task finishes.
 *  3. Any tasks that were scheduled after the interrupted one are also shifted.
 *
 * Returns updated array of existing tasks (new task is NOT in this array).
 */
export function applyPriorityInterrupt(existingTasks: Task[], newTask: Task): Task[] {
  const now = new Date(newTask.startTime);

  // Find tasks that are currently active (started but not done/overdue)
  // and have lower priority than the new task
  const newPriorityWeight = PRIORITY_ORDER[newTask.priority];

  // Tasks that are "in progress" right now = started <= now < effectiveEndTime
  const activeInferiorTasks = existingTasks.filter((t) => {
    if (t.status === 'done') return false;
    const started = new Date(t.startTime) <= now;
    const notEnded = new Date(t.effectiveEndTime) > now;
    const lowerPriority = PRIORITY_ORDER[t.priority] > newPriorityWeight;
    return started && notEnded && lowerPriority;
  });

  if (activeInferiorTasks.length === 0) return existingTasks;

  // The highest-priority among interrupted tasks (closest to the new task's priority)
  const interrupted = activeInferiorTasks.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  )[0];

  // How many minutes had elapsed on the interrupted task
  const elapsedMins = minutesBetween(interrupted.startTime, newTask.startTime);
  const remaining = Math.max(0, interrupted.duration - elapsedMins);

  // New task ends at: newTask.startTime + newTask.duration
  const newTaskEnd = addMinutes(newTask.startTime, newTask.duration);

  // Interrupted task resumes after the new task and runs for its remaining time
  const updatedInterrupted: Task = {
    ...interrupted,
    remainingMinutes: remaining,
    // Resume start = after new task finishes; effective end = resume + remaining
    effectiveEndTime: addMinutes(newTaskEnd, remaining),
  };

  // Shift any tasks that were scheduled to start after the interrupted task's
  // original end time — they all slide right by `newTask.duration` minutes
  const shiftBy = newTask.duration; // minutes

  return existingTasks.map((t) => {
    if (t.id === interrupted.id) return updatedInterrupted;

    // Tasks that start at or after the interrupted task's original end → shift
    const startsAfterInterrupt = new Date(t.startTime) >= new Date(interrupted.effectiveEndTime);
    if (startsAfterInterrupt && t.status !== 'done') {
      return {
        ...t,
        startTime: addMinutes(t.startTime, shiftBy),
        effectiveEndTime: addMinutes(t.effectiveEndTime, shiftBy),
      };
    }
    return t;
  });
}

// ─── Build a new task with computed effectiveEndTime ─────────────────────────

export function buildTaskTiming(
  startTime: string,
  duration: DurationMinutes,
): { startTime: string; effectiveEndTime: string; remainingMinutes: null } {
  return {
    startTime,
    effectiveEndTime: addMinutes(startTime, duration),
    remainingMinutes: null,
  };
}

// ─── Status derived from timing ───────────────────────────────────────────────

export function deriveStatus(task: Task): Task['status'] {
  if (task.status === 'done') return 'done';
  if (isOverdue(task)) return 'overdue';
  return task.status;
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

export function priorityGroupLabel(priority: Priority): string {
  return { high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority' }[priority];
}
