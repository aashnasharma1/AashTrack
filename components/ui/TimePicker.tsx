'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

type HM = { h: number; m: number };

function parse(t?: string): HM {
  if (!t) return { h: 9, m: 0 };
  const [hStr, mStr] = t.split(':');
  return { h: parseInt(hStr ?? '9', 10), m: parseInt(mStr ?? '0', 10) };
}

function fmt({ h, m }: HM) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const PRESETS = [
  { label: 'Morning', h: 9, m: 0 },
  { label: 'Midday', h: 12, m: 0 },
  { label: 'Afternoon', h: 15, m: 0 },
  { label: 'Evening', h: 18, m: 0 },
  { label: 'Night', h: 21, m: 0 },
] as const;

function Spinner({ value, onInc, onDec }: { value: number; onInc: () => void; onDec: () => void }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        tabIndex={-1}
        onClick={onInc}
        className="flex h-6 w-8 items-center justify-center rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
      </button>
      <span className="flex h-9 w-9 select-none items-center justify-center rounded-lg bg-gray-50 font-mono text-lg font-bold text-gray-800 dark:bg-gray-700 dark:text-gray-100">
        {String(value).padStart(2, '0')}
      </span>
      <button
        type="button"
        tabIndex={-1}
        onClick={onDec}
        className="flex h-6 w-8 items-center justify-center rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>
    </div>
  );
}

interface PanelProps {
  start: HM;
  end: HM;
  activeTab: 'start' | 'end';
  onTabChange: (t: 'start' | 'end') => void;
  onSetTime: (v: HM) => void;
  onClear: () => void;
  onDone?: () => void;
}

function PickerPanel({
  start,
  end,
  activeTab,
  onTabChange,
  onSetTime,
  onClear,
  onDone,
}: PanelProps) {
  const active = activeTab === 'start' ? start : end;

  return (
    <div className="w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
      {/* Tabs — Start / End */}
      <div className="grid grid-cols-2 border-b border-gray-100 dark:border-gray-800">
        {(['start', 'end'] as const).map((tab) => {
          const val = tab === 'start' ? start : end;
          const active_ = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
                active_
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
              )}
            >
              <Clock className="h-3 w-3" aria-hidden="true" />
              {tab === 'start' ? 'Start' : 'End'} ·{' '}
              <span className="font-mono tabular-nums">{fmt(val)}</span>
            </button>
          );
        })}
      </div>

      {/* Body: presets + spinner */}
      <div className="flex">
        {/* Quick presets */}
        <div className="flex-1 border-r border-gray-50 py-1 dark:border-gray-800">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onSetTime({ h: p.h, m: p.m })}
              className="flex w-full items-center justify-between px-4 py-2 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="text-gray-700 dark:text-gray-300">{p.label}</span>
              <span className="font-mono tabular-nums text-gray-400">
                {fmt({ h: p.h, m: p.m })}
              </span>
            </button>
          ))}
        </div>

        {/* Spinners */}
        <div className="flex flex-col items-center justify-center gap-1.5 px-5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            {activeTab === 'start' ? 'Start' : 'End'}
          </p>
          <div className="flex items-center gap-1">
            <Spinner
              value={active.h}
              onInc={() => onSetTime({ ...active, h: (active.h + 1) % 24 })}
              onDec={() => onSetTime({ ...active, h: (active.h - 1 + 24) % 24 })}
            />
            <span className="select-none pb-0.5 text-xl font-bold text-gray-200 dark:text-gray-700">
              :
            </span>
            <Spinner
              value={active.m}
              onInc={() => onSetTime({ ...active, m: (active.m + 15) % 60 })}
              onDec={() => onSetTime({ ...active, m: (active.m - 15 + 60) % 60 })}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 dark:border-gray-800">
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-gray-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
        >
          Clear
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

export interface TimeRangePickerProps {
  startTime?: string;
  endTime?: string;
  onChange: (startTime?: string, endTime?: string) => void;
  /** Render inline without a trigger button (for use inside forms) */
  inline?: boolean;
}

export function TimeRangePicker({ startTime, endTime, onChange, inline }: TimeRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<HM>(() => parse(startTime));
  const [end, setEnd] = useState<HM>(() => parse(endTime));
  const [activeTab, setActiveTab] = useState<'start' | 'end'>('start');
  const [popStyle, setPopStyle] = useState<React.CSSProperties>({});
  const trigRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStart(parse(startTime));
    setEnd(parse(endTime));
  }, [startTime, endTime]);

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current?.contains(e.target as Node)) return;
      if (trigRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const openPicker = () => {
    if (!trigRef.current) return;
    const rect = trigRef.current.getBoundingClientRect();
    const h = 262; // estimated picker height
    const showBelow = window.innerHeight - rect.bottom >= h;
    setPopStyle({
      position: 'fixed',
      top: showBelow ? rect.bottom + 6 : rect.top - h - 6,
      left: Math.min(rect.left, window.innerWidth - 296),
      zIndex: 9999,
    });
    setOpen((v) => !v);
  };

  const apply = (s: HM, e: HM) => onChange(fmt(s), fmt(e));
  const clear = () => {
    onChange(undefined, undefined);
    setOpen(false);
  };

  const handleSetTime = (v: HM) => {
    if (activeTab === 'start') {
      setStart(v);
      apply(v, end);
    } else {
      setEnd(v);
      apply(start, v);
    }
  };

  const hasTime = !!(startTime || endTime);

  if (inline) {
    return (
      <PickerPanel
        start={start}
        end={end}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSetTime={handleSetTime}
        onClear={() => onChange(undefined, undefined)}
      />
    );
  }

  return (
    <>
      <button
        ref={trigRef}
        type="button"
        onClick={openPicker}
        className={cn(
          'flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs transition-colors',
          hasTime
            ? 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800',
        )}
        aria-label={hasTime ? `Schedule: ${startTime ?? ''} to ${endTime ?? ''}` : 'Add schedule'}
        title="Set start and end time"
      >
        <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
        {hasTime ? (
          <span className="font-medium tabular-nums">
            {startTime ?? ''}
            {startTime && endTime ? ' – ' : ''}
            {endTime ?? ''}
          </span>
        ) : (
          <span>Add time</span>
        )}
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div ref={popRef} style={popStyle}>
            <PickerPanel
              start={start}
              end={end}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onSetTime={handleSetTime}
              onClear={clear}
              onDone={() => setOpen(false)}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
