'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flag, Layers, ChevronDown, ChevronUp, Clock, Repeat, Plus, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { useTaskContext } from '@/context/TaskContext';
import { taskSchema, TITLE_MAX, DESCRIPTION_MAX } from '@/lib/validation';
import type { TaskSchemaValues } from '@/lib/validation';
import type {
  Collection,
  Task,
  TaskFormValues,
  Priority,
  RepeatFreq,
  TaskRecurrence,
} from '@/types/task';
import { cn } from '@/lib/cn';

// ── Duration Schedule Picker ──────────────────────────────────────────────────

const DURATION_OPTS = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
  { label: '2 hr', minutes: 120 },
  { label: '4 hr', minutes: 240 },
] as const;

function toHHMM(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function fromHHMM(t: string): number {
  const [hs = '0', ms = '0'] = t.split(':');
  return parseInt(hs, 10) * 60 + parseInt(ms, 10);
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addOneDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface DurationPickerProps {
  startTime?: string;
  endTime?: string;
  startDate?: string;
  onChange: (startTime: string, endTime: string, startDate: string, endDate: string) => void;
  onClear: () => void;
}

function DurationSchedulePicker({
  startTime,
  endTime,
  startDate,
  onChange,
  onClear,
}: DurationPickerProps) {
  const [open, setOpen] = useState(false);
  const [popStyle, setPopStyle] = useState<CSSProperties>({});
  const trigRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState(30);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [startMin, setStartMin] = useState(() => {
    if (startTime) return fromHHMM(startTime);
    const now = new Date();
    return Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15;
  });
  const [date, setDate] = useState(() => startDate ?? todayISO());

  useEffect(() => {
    if (startTime) {
      setStartMin(fromHHMM(startTime));
    } else {
      const now = new Date();
      setStartMin(Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15);
      setDuration(30);
      setIsCustom(false);
      setCustomInput('');
    }
    setDate(startDate ?? todayISO());
    if (startTime && endTime) {
      let diff = fromHHMM(endTime) - fromHHMM(startTime);
      if (diff < 0) diff += 24 * 60;
      setDuration(diff);
      const isPreset = DURATION_OPTS.some((o) => o.minutes === diff);
      setIsCustom(!isPreset);
      if (!isPreset) setCustomInput(String(diff));
    }
  }, [startTime, endTime, startDate]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current?.contains(e.target as Node)) return;
      if (trigRef.current?.contains(e.target as Node)) return;
      // Ignore clicks inside nested portals (e.g. the DatePicker calendar)
      if ((e.target as Element)?.closest?.('[data-picker-portal]')) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const openPicker = () => {
    if (!trigRef.current) return;
    const rect = trigRef.current.getBoundingClientRect();
    const popH = 290;
    const showBelow = window.innerHeight - rect.bottom >= popH;
    setPopStyle({
      position: 'fixed',
      top: showBelow ? rect.bottom + 6 : rect.top - popH - 6,
      left: Math.min(rect.left, window.innerWidth - 300),
      zIndex: 9999,
    });
    setOpen((v) => !v);
  };

  const nowMin = () => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  };
  const minFloor = date === todayISO() ? nowMin() : 0;
  const safeStartMin = Math.max(startMin, minFloor);

  const endTotalMin = safeStartMin + duration;
  const computedEndMin = endTotalMin % (24 * 60);
  const isNextDay = endTotalMin >= 24 * 60;

  const commit = (s: number, dur: number, dt: string) => {
    const floor = dt === todayISO() ? nowMin() : 0;
    const safeS = Math.max(s, floor);
    const endTotal = safeS + dur;
    const endM = endTotal % (24 * 60);
    const endDt = endTotal >= 24 * 60 ? addOneDay(dt) : dt;
    onChange(toHHMM(safeS), toHHMM(endM), dt, endDt);
  };

  const hasSchedule = !!startTime;

  const displayDurMin =
    startTime && endTime
      ? (() => {
          const d = fromHHMM(endTime) - fromHHMM(startTime);
          return d < 0 ? d + 24 * 60 : d;
        })()
      : null;
  const durLabel =
    DURATION_OPTS.find((o) => o.minutes === (displayDurMin ?? duration))?.label ??
    (displayDurMin ? `${displayDurMin}min` : '');

  return (
    <>
      <button
        ref={trigRef}
        type="button"
        onClick={openPicker}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
          hasSchedule
            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
        )}
      >
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {hasSchedule ? `${durLabel} · ${startTime}–${endTime}` : 'Add duration'}
        <ChevronDown
          className={cn(
            'h-3 w-3 shrink-0 text-gray-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popRef}
            style={popStyle}
            className="w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            {/* Duration pills */}
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Duration
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_OPTS.map((opt) => (
                  <button
                    key={opt.minutes}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setCustomInput('');
                      setDuration(opt.minutes);
                      commit(startMin, opt.minutes, date);
                    }}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                      !isCustom && duration === opt.minutes
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(true);
                    setCustomInput(String(duration));
                  }}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                    isCustom
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                  )}
                >
                  Custom
                </button>
              </div>
              {isCustom && (
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={customInput}
                    onChange={(e) => {
                      setCustomInput(e.target.value);
                      const mins = parseInt(e.target.value, 10);
                      if (mins > 0 && mins <= 1440) {
                        setDuration(mins);
                        commit(startMin, mins, date);
                      }
                    }}
                    placeholder="e.g. 45"
                    autoFocus
                    className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs font-bold text-gray-800 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <span className="text-xs text-gray-400">minutes</span>
                </div>
              )}
            </div>

            {/* Start time + date */}
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Start time
              </p>
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center gap-1">
                  {/* Hour spinner */}
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const raw =
                          ((Math.floor(safeStartMin / 60) + 1) % 24) * 60 + (safeStartMin % 60);
                        const newS = Math.max(raw, minFloor);
                        setStartMin(newS);
                        commit(newS, duration, date);
                      }}
                      className="flex h-5 w-7 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ChevronUp className="h-3 w-3 text-gray-400" />
                    </button>
                    <span className="flex h-7 w-7 select-none items-center justify-center rounded bg-gray-50 font-mono text-sm font-bold text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                      {String(Math.floor(safeStartMin / 60)).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const raw =
                          ((Math.floor(safeStartMin / 60) - 1 + 24) % 24) * 60 +
                          (safeStartMin % 60);
                        const newS = Math.max(raw, minFloor);
                        setStartMin(newS);
                        commit(newS, duration, date);
                      }}
                      className="flex h-5 w-7 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </button>
                  </div>
                  <span className="pb-0.5 text-sm font-bold text-gray-200 dark:text-gray-700">
                    :
                  </span>
                  {/* Minute spinner */}
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const raw =
                          Math.floor(safeStartMin / 60) * 60 + (((safeStartMin % 60) + 15) % 60);
                        const newS = Math.max(raw, minFloor);
                        setStartMin(newS);
                        commit(newS, duration, date);
                      }}
                      className="flex h-5 w-7 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ChevronUp className="h-3 w-3 text-gray-400" />
                    </button>
                    <span className="flex h-7 w-7 select-none items-center justify-center rounded bg-gray-50 font-mono text-sm font-bold text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                      {String(safeStartMin % 60).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const raw =
                          Math.floor(safeStartMin / 60) * 60 +
                          (((safeStartMin % 60) - 15 + 60) % 60);
                        const newS = Math.max(raw, minFloor);
                        setStartMin(newS);
                        commit(newS, duration, date);
                      }}
                      className="flex h-5 w-7 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </button>
                  </div>
                </div>
                {/* Date picker */}
                <div className="min-w-0 flex-1">
                  <DatePicker
                    value={date}
                    onChange={(d) => {
                      const newDate = d ?? todayISO();
                      setDate(newDate);
                      const floor = newDate === todayISO() ? nowMin() : 0;
                      const safe = Math.max(startMin, floor);
                      setStartMin(safe);
                      commit(safe, duration, newDate);
                    }}
                    minDate={todayISO()}
                  />
                </div>
              </div>
              {minFloor > 0 && safeStartMin === minFloor && (
                <p className="mt-1.5 text-[10px] text-amber-500">
                  Earliest available — clamped to now
                </p>
              )}
            </div>

            {/* End time (auto-calculated, read-only) */}
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                End time (auto)
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {toHHMM(computedEndMin)}
                </span>
                {isNextDay && (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                    +1 day
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="text-xs text-gray-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Recurrence Picker ────────────────────────────────────────────────────────

const FREQ_OPTS: { value: RepeatFreq; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface RecurrencePickerProps {
  value: TaskRecurrence | null;
  onChange: (v: TaskRecurrence | null) => void;
}

function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const [open, setOpen] = useState(false);
  const [popStyle, setPopStyle] = useState<CSSProperties>({});
  const trigRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const [frequency, setFrequency] = useState<RepeatFreq>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]);
  const [occurrences, setOccurrences] = useState(7);
  const [occInput, setOccInput] = useState('7');

  useEffect(() => {
    if (value) {
      setFrequency(value.frequency);
      setCustomDays(value.customDays);
      setOccurrences(value.occurrences);
      setOccInput(String(value.occurrences));
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current?.contains(e.target as Node)) return;
      if (trigRef.current?.contains(e.target as Node)) return;
      if ((e.target as Element)?.closest?.('[data-picker-portal]')) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const openPicker = () => {
    if (!trigRef.current) return;
    const rect = trigRef.current.getBoundingClientRect();
    const popH = 240;
    const showBelow = window.innerHeight - rect.bottom >= popH;
    setPopStyle({
      position: 'fixed',
      top: showBelow ? rect.bottom + 6 : rect.top - popH - 6,
      left: Math.min(rect.left, window.innerWidth - 300),
      zIndex: 9999,
    });
    setOpen((v) => !v);
  };

  const commit = (freq: RepeatFreq, days: number[], occ: number) =>
    onChange({ frequency: freq, customDays: days, occurrences: occ });

  const toggleDay = (d: number) => {
    const next = customDays.includes(d)
      ? customDays.filter((x) => x !== d)
      : [...customDays, d].sort((a, b) => a - b);
    setCustomDays(next);
    commit(frequency, next, occurrences);
  };

  const freqLabel =
    FREQ_OPTS.find((o) => o.value === (value?.frequency ?? frequency))?.label ?? 'Daily';
  const hasRecurrence = !!value;

  return (
    <>
      <button
        ref={trigRef}
        type="button"
        onClick={openPicker}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
          hasRecurrence
            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
        )}
      >
        <Repeat className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {hasRecurrence ? `${freqLabel} · ${value.occurrences}×` : 'No repeat'}
        <ChevronDown
          className={cn(
            'h-3 w-3 shrink-0 text-gray-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popRef}
            style={popStyle}
            className="w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            {/* Frequency */}
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Frequency
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FREQ_OPTS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setFrequency(opt.value);
                      commit(opt.value, customDays, occurrences);
                    }}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                      frequency === opt.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Day picker — only for Custom */}
              {frequency === 'custom' && (
                <div className="mt-2.5 flex gap-1">
                  {DAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors',
                        customDays.includes(i)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Occurrences */}
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Repeat for
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={occInput}
                  onChange={(e) => {
                    setOccInput(e.target.value);
                    const n = parseInt(e.target.value, 10);
                    if (n >= 1 && n <= 365) {
                      setOccurrences(n);
                      commit(frequency, customDays, n);
                    }
                  }}
                  className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-sm font-bold text-gray-800 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <span className="text-xs text-gray-400">occurrences</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="text-xs text-gray-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Bulk row ─────────────────────────────────────────────────────────────────

interface BulkRow {
  id: string;
  title: string;
  priority: Priority;
  status: string;
  collection: string;
}

// ── Priority rank (higher = more important) ───────────────────────────────────

const PRIORITY_RANK: Record<Priority, number> = { low: 1, medium: 2, high: 3 };

// ── Priority options ───────────────────────────────────────────────────────────

const PRIORITY_OPTS: { value: Priority; label: string; flagCls: string }[] = [
  { value: 'high', label: 'High', flagCls: 'text-red-500' },
  { value: 'medium', label: 'Medium', flagCls: 'text-amber-400' },
  { value: 'low', label: 'Low', flagCls: 'text-emerald-500' },
];

// ── Field chip dropdown ───────────────────────────────────────────────────────

function FieldChip({
  trigger,
  highlighted,
  renderMenu,
}: {
  trigger: React.ReactNode;
  highlighted?: boolean;
  renderMenu: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
          highlighted
            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
        )}
      >
        {trigger}
        <ChevronDown
          className={cn(
            'h-3 w-3 shrink-0 text-gray-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {renderMenu(close)}
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
  defaultValues?: Task;
  collections?: Collection[];
  lockedCollection?: string;
}

export function TaskForm({
  open,
  onClose,
  onSubmit,
  defaultValues,
  collections = [],
  lockedCollection,
}: TaskFormProps) {
  const {
    state: { statusGroups, tasks },
    addTask,
    updateTask,
  } = useTaskContext();
  const isEditing = !!defaultValues;

  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);

  const makeBulkRow = (): BulkRow => ({
    id: Math.random().toString(36).slice(2),
    title: '',
    priority: 'low',
    status: statusGroups[0]?.id ?? 'todo',
    collection: lockedCollection ?? collections[0]?.slug ?? '',
  });

  const updateBulkRow = (id: string, patch: Partial<BulkRow>) =>
    setBulkRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleBulkSubmit = () => {
    const valid = bulkRows.filter((r) => r.title.trim());
    if (!valid.length) return;
    valid.forEach((row) =>
      addTask({
        title: row.title.trim(),
        description: '',
        priority: row.priority,
        status: row.status,
        collection: row.collection,
      }),
    );
    handleClose();
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskSchemaValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'low',
      status: 'todo',
      collection: lockedCollection ?? '',
      startTime: '',
      endTime: '',
    },
  });

  useEffect(() => {
    if (open) {
      setMode('single');
      setBulkRows(Array.from({ length: 5 }, makeBulkRow));
      setRecurrence(defaultValues?.recurrence ?? null);
      setConflictError(null);
      reset(
        defaultValues
          ? {
              title: defaultValues.title,
              description: defaultValues.description,
              priority: defaultValues.priority,
              status: defaultValues.status,
              collection: defaultValues.collection,
              startTime: defaultValues.startTime ?? '',
              endTime: defaultValues.endTime ?? '',
              startDate: defaultValues.startDate ?? '',
              endDate: defaultValues.endDate ?? '',
            }
          : {
              title: '',
              description: '',
              priority: 'low',
              status: 'todo',
              collection: lockedCollection ?? '',
              startTime: '',
              endTime: '',
              startDate: '',
              endDate: '',
            },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultValues, lockedCollection, reset]);

  const statusValue = watch('status');
  const priorityValue = watch('priority');
  const collectionValue = watch('collection');
  const startTimeValue = watch('startTime');
  const endTimeValue = watch('endTime');
  const startDateValue = watch('startDate');

  const handleClose = () => {
    reset();
    setRecurrence(null);
    setConflictError(null);
    onClose();
  };

  const handleFormSubmit = (values: TaskSchemaValues) => {
    const base = values as TaskFormValues;

    // ── Priority-based conflict resolution ──────────────────────────────────
    if (base.startTime && base.endTime) {
      const newStart = fromHHMM(base.startTime);
      const newEnd = fromHHMM(base.endTime);
      const newDate = base.startDate || todayISO();
      const ne = newEnd <= newStart ? newEnd + 1440 : newEnd;
      const newRank = PRIORITY_RANK[base.priority];

      const conflicting = tasks.filter((t) => {
        if (t.id === defaultValues?.id) return false; // skip self on edit
        if (!t.startTime || !t.endTime) return false;
        if ((t.startDate || todayISO()) !== newDate) return false;
        const ts = fromHHMM(t.startTime);
        const te = fromHHMM(t.endTime);
        const te2 = te <= ts ? te + 1440 : te;
        return newStart < te2 && ts < ne; // classic overlap
      });

      if (conflicting.length > 0) {
        // Block: two high-priority tasks in the same slot
        if (base.priority === 'high' && conflicting.some((t) => t.priority === 'high')) {
          setConflictError(
            'A high priority task already occupies this slot. High priority tasks cannot overlap.',
          );
          return;
        }

        // Displace any tasks with lower priority than the new task
        conflicting
          .filter((t) => PRIORITY_RANK[t.priority] < newRank)
          .forEach((t) => {
            const ts = fromHHMM(t.startTime!);
            const te = fromHHMM(t.endTime!);
            const dur = te <= ts ? te + 1440 - ts : te - ts;
            updateTask(t.id, {
              title: t.title,
              description: t.description,
              priority: t.priority,
              status: t.status,
              collection: t.collection,
              startTime: toHHMM(newEnd % 1440),
              endTime: toHHMM((newEnd + dur) % 1440),
              startDate: t.startDate,
              endDate: t.endDate,
            });
          });
      }
    }

    setConflictError(null);

    // Save one task — recurrence is stored as metadata, not duplicate tasks
    onSubmit({
      ...base,
      recurring: !!recurrence,
      recurrence: recurrence ?? undefined,
    });

    handleClose();
  };

  const statusGroup = statusGroups.find((g) => g.id === statusValue) ?? statusGroups[0];
  const priorityCfg = PRIORITY_OPTS.find((o) => o.value === priorityValue) ?? PRIORITY_OPTS[1];
  const collectionName = collections.find((c) => c.slug === collectionValue)?.name;

  const validBulkCount = bulkRows.filter((r) => r.title.trim()).length;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className={mode === 'bulk' && !isEditing ? 'max-w-3xl' : 'max-w-xl'}
    >
      {/* Mode toggle — create only, anchored top-right beside close button */}
      {!isEditing && (
        <div className="mb-3 flex items-center justify-end pr-8">
          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-[11px] dark:border-gray-700 dark:bg-gray-800">
            {(['single', 'bulk'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  'rounded px-2.5 py-1 font-medium capitalize transition-colors',
                  mode === m
                    ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                )}
              >
                {m === 'single' ? 'Single' : 'Bulk'}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'bulk' && !isEditing ? (
        /* ── Bulk table ───────────────────────────────────────────────────────── */
        <div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="w-7 pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    #
                  </th>
                  <th className="pb-2 pl-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Name *
                  </th>
                  <th className="w-24 pb-2 pl-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Priority
                  </th>
                  <th className="w-28 pb-2 pl-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Status
                  </th>
                  {!lockedCollection && (
                    <th className="w-32 pb-2 pl-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Collection
                    </th>
                  )}
                  <th className="w-7 pb-2" />
                </tr>
              </thead>
              <tbody>
                {bulkRows.map((row, idx) => (
                  <tr key={row.id} className="border-b border-gray-50 dark:border-gray-800/50">
                    <td className="py-1.5 text-center text-gray-400">{idx + 1}</td>
                    <td className="py-1.5 pl-2">
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => updateBulkRow(row.id, { title: e.target.value })}
                        placeholder="Task name"
                        className="w-full rounded border border-gray-200 bg-transparent px-2 py-1 text-xs text-gray-900 outline-none focus:border-blue-400 dark:border-gray-700 dark:text-gray-100"
                      />
                    </td>
                    <td className="py-1.5 pl-2">
                      <select
                        value={row.priority}
                        onChange={(e) =>
                          updateBulkRow(row.id, { priority: e.target.value as Priority })
                        }
                        className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </td>
                    <td className="py-1.5 pl-2">
                      <select
                        value={row.status}
                        onChange={(e) => updateBulkRow(row.id, { status: e.target.value })}
                        className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {statusGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    {!lockedCollection && (
                      <td className="py-1.5 pl-2">
                        <select
                          value={row.collection}
                          onChange={(e) => updateBulkRow(row.id, { collection: e.target.value })}
                          className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {collections.length === 0 ? (
                            <option value="">No collections</option>
                          ) : (
                            collections.map((c) => (
                              <option key={c.slug} value={c.slug}>
                                {c.name}
                              </option>
                            ))
                          )}
                        </select>
                      </td>
                    )}
                    <td className="py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => setBulkRows((prev) => prev.filter((r) => r.id !== row.id))}
                        className="rounded p-0.5 text-gray-300 transition-colors hover:text-red-400 dark:text-gray-600"
                        aria-label="Remove row"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add rows */}
          <button
            type="button"
            onClick={() =>
              setBulkRows((prev) => [...prev, ...Array.from({ length: 5 }, makeBulkRow)])
            }
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-blue-500"
          >
            <Plus className="h-3.5 w-3.5" />5 more rows
          </button>

          <div className="-mx-5 mt-4 border-t border-gray-100 dark:border-gray-800" />

          {/* Footer */}
          <div className="flex items-center justify-between pt-4">
            <span className="text-xs text-gray-400">
              {validBulkCount > 0
                ? `${validBulkCount} of ${bulkRows.length} rows will be created`
                : 'Fill in at least one name to create tasks'}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={validBulkCount === 0}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                Create {validBulkCount || ''} Tasks
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          {/* Title input */}
          <div className="mb-4 pr-8">
            <input
              {...register('title')}
              placeholder="Task name"
              maxLength={TITLE_MAX}
              autoComplete="off"
              className="w-full bg-transparent text-xl font-bold text-gray-900 outline-none placeholder:text-gray-300 dark:text-gray-100 dark:placeholder:text-gray-700"
            />
            {errors.title && <p className="mt-1.5 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="mb-6">
            <textarea
              {...register('description')}
              placeholder="Add a description…"
              maxLength={DESCRIPTION_MAX}
              rows={3}
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-500 outline-none placeholder:text-gray-300 dark:text-gray-400 dark:placeholder:text-gray-700"
            />
          </div>

          <div className="-mx-5 border-t border-gray-100 dark:border-gray-800" />

          {/* Field chips row */}
          <div className="flex flex-wrap items-center gap-2 py-4">
            {/* Status */}
            <FieldChip
              trigger={
                <>
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: statusGroup?.color }}
                    aria-hidden="true"
                  />
                  {statusGroup?.label ?? statusValue}
                </>
              }
              renderMenu={(close) => (
                <>
                  {statusGroups.map((grp) => (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => {
                        setValue('status', grp.id, { shouldDirty: true });
                        close();
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                        statusValue === grp.id
                          ? 'font-semibold text-gray-900 dark:text-gray-100'
                          : 'text-gray-600 dark:text-gray-300',
                      )}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: grp.color }}
                        aria-hidden="true"
                      />
                      {grp.label}
                      {statusValue === grp.id && <span className="ml-auto text-blue-500">✓</span>}
                    </button>
                  ))}
                </>
              )}
            />

            {/* Priority */}
            <FieldChip
              trigger={
                <>
                  <Flag
                    className={cn('h-3.5 w-3.5 shrink-0', priorityCfg.flagCls)}
                    aria-hidden="true"
                  />
                  {priorityCfg.label}
                </>
              }
              renderMenu={(close) => (
                <>
                  {PRIORITY_OPTS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setValue('priority', opt.value, { shouldDirty: true });
                        close();
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                        priorityValue === opt.value
                          ? 'font-semibold text-gray-900 dark:text-gray-100'
                          : 'text-gray-600 dark:text-gray-300',
                      )}
                    >
                      <Flag
                        className={cn('h-3.5 w-3.5 shrink-0', opt.flagCls)}
                        aria-hidden="true"
                      />
                      {opt.label}
                      {priorityValue === opt.value && (
                        <span className="ml-auto text-blue-500">✓</span>
                      )}
                    </button>
                  ))}
                </>
              )}
            />

            {/* Collection — hidden when locked */}
            {lockedCollection ? (
              <input type="hidden" {...register('collection')} />
            ) : (
              <FieldChip
                highlighted={!!collectionValue}
                trigger={
                  <>
                    <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {collectionName ?? 'Collection'}
                  </>
                }
                renderMenu={(close) => (
                  <>
                    {collections.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-gray-400">No collections yet</p>
                    ) : (
                      collections.map((c) => (
                        <button
                          key={c.slug}
                          type="button"
                          onClick={() => {
                            setValue('collection', c.slug, { shouldDirty: true });
                            close();
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                            collectionValue === c.slug
                              ? 'font-semibold text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-300',
                          )}
                        >
                          {c.name}
                          {collectionValue === c.slug && (
                            <span className="ml-auto text-blue-500">✓</span>
                          )}
                        </button>
                      ))
                    )}
                  </>
                )}
              />
            )}

            {/* Recurrence */}
            <RecurrencePicker value={recurrence} onChange={setRecurrence} />

            {/* Duration + schedule */}
            <DurationSchedulePicker
              startTime={startTimeValue || undefined}
              endTime={endTimeValue || undefined}
              startDate={startDateValue || undefined}
              onChange={(s, e, sd, ed) => {
                setValue('startTime', s);
                setValue('endTime', e);
                setValue('startDate', sd);
                setValue('endDate', ed);
              }}
              onClear={() => {
                setValue('startTime', '');
                setValue('endTime', '');
                setValue('startDate', '');
                setValue('endDate', '');
              }}
            />
          </div>

          {/* Collection error */}
          {errors.collection && (
            <p className="-mt-1 mb-2 text-xs text-red-500">{errors.collection.message}</p>
          )}

          {/* Conflict error */}
          {conflictError && (
            <p className="-mt-1 mb-2 flex items-center gap-1.5 text-xs text-red-500">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              {conflictError}
            </p>
          )}

          <div className="-mx-5 border-t border-gray-100 dark:border-gray-800" />

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-5">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? '…' : isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
