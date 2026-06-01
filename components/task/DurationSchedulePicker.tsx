'use client';

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { DatePicker } from '@/components/ui/DatePicker';
import { cn } from '@/lib/cn';
import { toHHMM, fromHHMM, todayISO, addOneDay } from '@/lib/timeUtils';

const DURATION_OPTS = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
  { label: '2 hr', minutes: 120 },
  { label: '4 hr', minutes: 240 },
] as const;

export interface DurationSchedulePickerProps {
  startTime?: string;
  endTime?: string;
  startDate?: string;
  onChange: (startTime: string, endTime: string, startDate: string, endDate: string) => void;
  onClear: () => void;
}

export function DurationSchedulePicker({
  startTime,
  endTime,
  startDate,
  onChange,
  onClear,
}: DurationSchedulePickerProps) {
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
      top: showBelow ? rect.bottom - 32 : rect.top - popH - 6,
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

            {/* End time (auto) */}
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
