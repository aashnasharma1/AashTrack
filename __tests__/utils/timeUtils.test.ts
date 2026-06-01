import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  addOneDay,
  adjustForNextDay,
  calcEnd,
  effectiveEnd,
  fmtDuration,
  fmtHour,
  fmtScheduleDateTime,
  fmtTime,
  fromHHMM,
  toHHMM,
  todayISO,
  toMin,
} from '@/lib/timeUtils';

describe('timeUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T10:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats and parses HH:MM values', () => {
    expect(toHHMM(0)).toBe('00:00');
    expect(toHHMM(75)).toBe('01:15');
    expect(toHHMM(24 * 60 + 5)).toBe('00:05');
    expect(fromHHMM('09:45')).toBe(585);
    expect(toMin('23:59')).toBe(1439);
  });

  it('returns today and next day ISO dates', () => {
    expect(todayISO()).toBe('2026-06-01');
    expect(addOneDay('2026-06-01')).toBe('2026-06-02');
  });

  it('calculates end time and date for same-day and next-day durations', () => {
    expect(calcEnd('10:00', '2026-06-01', 45)).toEqual({
      endTime: '10:45',
      endDate: '2026-06-01',
    });
    expect(calcEnd('23:30', '2026-06-01', 90)).toEqual({
      endTime: '01:00',
      endDate: '2026-06-02',
    });
  });

  it('formats scheduled datetimes and handles missing values', () => {
    expect(fmtScheduleDateTime('2026-06-01', '00:05')).toBe('01 Jun 2026, 12:05 AM');
    expect(fmtScheduleDateTime('2026-06-01', '12:00')).toBe('01 Jun 2026, 12:00 PM');
    expect(fmtScheduleDateTime('2026-06-01', '23:15')).toBe('01 Jun 2026, 11:15 PM');
    expect(fmtScheduleDateTime(undefined, '10:00')).toBeNull();
    expect(fmtScheduleDateTime('2026-06-01', undefined)).toBeNull();
  });

  it('formats durations for minutes, hours, and cross-midnight ranges', () => {
    expect(fmtDuration('10:00', '10:30')).toBe('30 min');
    expect(fmtDuration('10:00', '11:00')).toBe('1 hr');
    expect(fmtDuration('10:00', '12:00')).toBe('2 hr');
    expect(fmtDuration('23:30', '00:15')).toBe('45 min');
    expect(fmtDuration(undefined, '10:00')).toBeNull();
    expect(fmtDuration('10:00', undefined)).toBeNull();
  });

  it('formats timeline labels across midnight', () => {
    expect(fmtHour(0)).toBe('12:00 AM');
    expect(fmtHour(13 * 60)).toBe('1:00 PM');
    expect(fmtHour(25 * 60)).toBe('1:00 AM +1');
    expect(fmtTime(9 * 60 + 5)).toBe('9:05 AM');
    expect(fmtTime(24 * 60 + 30)).toBe('12:30 AM +1');
  });

  it('resolves effective end minutes and next-day adjustments', () => {
    expect(effectiveEnd(60, 120)).toBe(120);
    expect(effectiveEnd(23 * 60, 30)).toBe(1470);
    expect(adjustForNextDay(9 * 60, 17 * 60)).toBe(9 * 60);
    expect(adjustForNextDay(9 * 60, 19 * 60)).toBe(33 * 60);
    expect(adjustForNextDay(13 * 60, 19 * 60)).toBe(13 * 60);
  });
});
