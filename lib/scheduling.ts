import { PRIORITY_LABELS, type Priority, type Task, type TaskFormValues } from '@/types/task';
import { fromHHMM, todayISO, toHHMM } from '@/lib/timeUtils';

const PRIORITY_RANK: Record<Priority, number> = { low: 1, medium: 2, high: 3 };
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const EPOCH_DAY = Date.UTC(1970, 0, 1);

export interface ShiftedTaskSchedule {
  task: Task;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
}

export interface ScheduleResolution {
  ok: boolean;
  error?: string;
  shiftedTasks: ShiftedTaskSchedule[];
}

interface ScheduledTaskRange {
  task: Task;
  start: number;
  end: number;
  duration: number;
}

function dateToDay(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  return Math.floor((Date.UTC(year, month - 1, day) - EPOCH_DAY) / MS_PER_DAY);
}

function dayToDate(day: number): string {
  const d = new Date(EPOCH_DAY + day * MS_PER_DAY);
  return d.toISOString().slice(0, 10);
}

function absoluteToSchedule(startAbs: number, durationMin: number) {
  const endAbs = startAbs + durationMin;
  return {
    startTime: toHHMM(startAbs % 1440),
    endTime: toHHMM(endAbs % 1440),
    startDate: dayToDate(Math.floor(startAbs / 1440)),
    endDate: dayToDate(Math.floor(endAbs / 1440)),
  };
}

function scheduledRange(item: {
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
}): { start: number; end: number; duration: number } | null {
  if (!item.startTime || !item.endTime) return null;

  const startDay = dateToDay(item.startDate || todayISO());
  const start = startDay * 1440 + fromHHMM(item.startTime);

  const endTimeMin = fromHHMM(item.endTime);
  const endDay = item.endDate ? dateToDay(item.endDate) : startDay;
  let end = endDay * 1440 + endTimeMin;
  if (end <= start) end += 1440;

  return { start, end, duration: end - start };
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}

function findNextAvailableStart(
  earliestStart: number,
  durationMin: number,
  occupied: Array<{ start: number; end: number }>,
) {
  let candidate = earliestStart;

  for (;;) {
    const candidateRange = { start: candidate, end: candidate + durationMin };
    const conflict = occupied
      .filter((slot) => overlaps(candidateRange, slot))
      .sort((a, b) => a.end - b.end)[0];

    if (!conflict) return candidate;
    candidate = conflict.end;
  }
}

export function resolveScheduleConflicts(
  tasks: Task[],
  incoming: Pick<TaskFormValues, 'priority' | 'startTime' | 'endTime' | 'startDate' | 'endDate'>,
  excludeTaskId?: string,
): ScheduleResolution {
  const incomingRange = scheduledRange(incoming);
  if (!incomingRange) return { ok: true, shiftedTasks: [] };

  const incomingRank = PRIORITY_RANK[incoming.priority];
  const ranges = tasks
    .filter((task) => task.id !== excludeTaskId)
    .map((task) => ({ task, range: scheduledRange(task) }))
    .filter(
      (entry): entry is { task: Task; range: NonNullable<ReturnType<typeof scheduledRange>> } =>
        !!entry.range,
    );
  const conflicts = ranges.filter(({ range }) => overlaps(incomingRange, range));

  const blocking = conflicts.find(({ task }) => PRIORITY_RANK[task.priority] >= incomingRank);
  if (blocking) {
    const label = PRIORITY_LABELS[blocking.task.priority];
    return {
      ok: false,
      error: `Another ${label} priority task already exists during this time period.`,
      shiftedTasks: [],
    };
  }

  const displacedIds = new Set(conflicts.map(({ task }) => task.id));
  const occupied = ranges
    .filter(({ task }) => !displacedIds.has(task.id))
    .map(({ range }) => ({ start: range.start, end: range.end }));
  occupied.push({ start: incomingRange.start, end: incomingRange.end });

  const lowerPriorityConflicts: ScheduledTaskRange[] = conflicts
    .map(({ task, range }) => ({ task, ...range }))
    .sort(
      (a, b) =>
        a.start - b.start || PRIORITY_RANK[b.task.priority] - PRIORITY_RANK[a.task.priority],
    );

  const shiftedTasks = lowerPriorityConflicts.map(({ task, duration }) => {
    const nextStart = findNextAvailableStart(incomingRange.end, duration, occupied);
    const schedule = absoluteToSchedule(nextStart, duration);
    occupied.push({ start: nextStart, end: nextStart + duration });
    occupied.sort((a, b) => a.start - b.start);

    return {
      task,
      ...schedule,
    };
  });

  return {
    ok: true,
    shiftedTasks,
  };
}
