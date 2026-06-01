import type { Task } from '@/types/task';

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns true when a task's scheduled end time has passed and it isn't done. */
export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'done') return false;
  if (!task.endTime) return false;

  const now = new Date();
  const todayISO = toISO(now);
  const startDate = task.startDate ?? todayISO;

  // Task hasn't started yet
  if (startDate > todayISO) return false;

  const [sh = 0, sm = 0] = (task.startTime ?? '00:00').split(':').map(Number);
  const [eh = 0, em = 0] = task.endTime.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  // Cross-midnight: end time is numerically before start time
  const crossMidnight = task.startTime ? endMin < startMin : false;

  // Resolve the actual end date
  const endDateISO =
    task.endDate ??
    (crossMidnight
      ? (() => {
          const d = new Date(`${startDate}T00:00:00`);
          d.setDate(d.getDate() + 1);
          return toISO(d);
        })()
      : startDate);

  if (endDateISO > todayISO) return false; // end is in the future
  if (endDateISO < todayISO) return true; // end date has already passed

  // End date is today — check the clock
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Handle next-day scheduling: if it's late evening (after 6 PM) and task is early morning (before noon),
  // the task is scheduled for tomorrow, so it's not overdue
  if (nowMin >= 18 * 60 && startMin < 12 * 60) {
    return false;
  }

  return nowMin > endMin;
}
