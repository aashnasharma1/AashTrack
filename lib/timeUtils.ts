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
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
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
