'use client';

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Repeat, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { RepeatFreq, TaskRecurrence } from '@/types/task';

const FREQ_OPTS: { value: RepeatFreq; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface RecurrencePickerProps {
  value: TaskRecurrence | null;
  onChange: (v: TaskRecurrence | null) => void;
}

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
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
