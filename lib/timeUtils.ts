// ── Time string utilities ─────────────────────────────────────────────────────

/** Convert total minutes to "HH:MM" string. Wraps at 24h. */
export function toHHMM(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Parse "HH:MM" string to total minutes. */
export function fromHHMM(t: string): number {
  const [hs = '0', ms = '0'] = t.split(':');
  return parseInt(hs, 10) * 60 + parseInt(ms, 10);
}

/** Returns today's date as "YYYY-MM-DD" in local time. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns the ISO date string for the day after the given ISO date. */
export function addOneDay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Given a startTime HH:MM, startDate ISO, and duration minutes, compute endTime + endDate. */
export function calcEnd(
  startTime: string,
  startDate: string,
  durationMin: number,
): { endTime: string; endDate: string } {
  const startMin = fromHHMM(startTime);
  const total = startMin + durationMin;
  const endTime = toHHMM(total % (24 * 60));
  const endDate = total >= 24 * 60 ? addOneDay(startDate) : startDate;
  return { endTime, endDate };
}

// ── Scheduling constants ──────────────────────────────────────────────────────

export const DURATION_OPTS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: 'Custom', minutes: 0 },
] as const;

export const DEFAULT_DURATION = 30;

// ── Display formatters ────────────────────────────────────────────────────────

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Format a YYYY-MM-DD date + HH:MM time as "DD Mon YYYY, HH:MM AM/PM".
 * Returns null if either argument is missing.
 * Example: fmtScheduleDateTime('2026-06-01', '10:30') → "01 Jun 2026, 10:30 AM"
 */
export function fmtScheduleDateTime(
  dateISO: string | undefined,
  timeHHMM: string | undefined,
): string | null {
  if (!dateISO || !timeHHMM) return null;
  const [y, m, d] = dateISO.split('-').map(Number);
  const totalMin = fromHHMM(timeHHMM);
  const h = Math.floor(totalMin / 60) % 24;
  const min = totalMin % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}, ${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${suffix}`;
}

/**
 * Derive a human-readable duration label from startTime and endTime (HH:MM).
 * Returns null if either is missing. Handles cross-midnight.
 * Examples: "30 min", "1 hr", "2 hr", "90 min"
 */
export function fmtDuration(
  startTime: string | undefined,
  endTime: string | undefined,
): string | null {
  if (!startTime || !endTime) return null;
  let diff = fromHHMM(endTime) - fromHHMM(startTime);
  if (diff <= 0) diff += 24 * 60;
  if (diff <= 0) return null;
  if (diff % 60 === 0) {
    const hrs = diff / 60;
    return hrs === 1 ? '1 hr' : `${hrs} hr`;
  }
  return `${diff} min`;
}

// ── Timeline / scheduling utilities ──────────────────────────────────────────

/** Parse "HH:MM" to total minutes (alias matching DailyTimeline naming). */
export function toMin(t: string): number {
  return fromHHMM(t);
}

/** Format an axis label for a timeline minute value, appending "+1" when past midnight. */
export function fmtHour(min: number): string {
  const totalH = Math.floor(min / 60);
  const h = totalH % 24;
  const nextDay = totalH >= 24;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const label = `${h % 12 || 12}:00 ${suffix}`;
  return nextDay ? `${label} +1` : label;
}

/** Format a minute value as a time string, appending "+1" when past midnight. */
export function fmtTime(min: number): string {
  const totalH = Math.floor(min / 60);
  const h = totalH % 24;
  const m = min % 60;
  const nextDay = totalH >= 24;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const label = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
  return nextDay ? `${label} +1` : label;
}

/**
 * Resolve the effective end minute, handling cross-midnight tasks
 * where endTime wraps to the next day (end < start).
 */
export function effectiveEnd(startMin: number, endMin: number): number {
  return endMin < startMin ? endMin + 24 * 60 : endMin;
}

/**
 * Adjust a task's scheduled minute to account for next-day scheduling.
 * When the current time is past 6 PM and the task time is before noon,
 * treat it as a next-day task by adding 24 hours.
 */
export function adjustForNextDay(taskMin: number, nowMin: number): number {
  if (nowMin >= 18 * 60 && taskMin < 12 * 60) {
    return taskMin + 24 * 60;
  }
  return taskMin;
}
