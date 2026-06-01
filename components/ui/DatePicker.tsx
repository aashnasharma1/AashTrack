'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DatePickerProps {
  value?: string;
  onChange: (date: string | undefined) => void;
  placeholder?: string;
  minDate?: string; // YYYY-MM-DD — days before this are disabled
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [popStyle, setPopStyle] = useState<React.CSSProperties>({});

  const [displayMonth, setDisplayMonth] = useState(new Date().getMonth());
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (popRef.current?.contains(e.target as Node)) return;
      if (trigRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const openPicker = () => {
    if (!trigRef.current) return;
    const rect = trigRef.current.getBoundingClientRect();
    const h = 280; // estimated picker height
    const showBelow = window.innerHeight - rect.bottom >= h;
    setPopStyle({
      position: 'fixed',
      top: showBelow ? rect.bottom + 6 : rect.top - h - 6,
      left: Math.min(rect.left, window.innerWidth - 320),
      zIndex: 9999,
    });
    setOpen((v) => !v);
  };

  const fmtDate = (d: string) => {
    const dt = new Date(`${d}T00:00:00`);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysInMonth = getDaysInMonth(displayYear, displayMonth);
  const firstDay = getFirstDayOfMonth(displayYear, displayMonth);
  const days = Array(firstDay)
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const monthNames = [
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
  ];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const isoForDay = (day: number) =>
    `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isDayDisabled = (day: number) => !!minDate && isoForDay(day) < minDate;

  const isPrevDisabled = () => {
    if (!minDate) return false;
    const [minY, minM] = minDate.split('-').map(Number);
    return displayYear < (minY ?? 0) || (displayYear === minY && displayMonth <= (minM ?? 1) - 1);
  };

  const handlePrev = () => {
    if (isPrevDisabled()) return;
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const handleNext = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  const handleSelect = (day: number) => {
    if (isDayDisabled(day)) return;
    onChange(isoForDay(day));
    setOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setOpen(false);
  };

  return (
    <div ref={ref} className="w-full">
      <button
        ref={trigRef}
        type="button"
        onClick={openPicker}
        className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600"
      >
        <span>{value ? fmtDate(value) : placeholder}</span>
        <X className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popRef}
            data-picker-portal=""
            style={popStyle}
            className="rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900"
          >
            {/* Month/Year header */}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isPrevDisabled()}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                  isPrevDisabled() && 'cursor-not-allowed opacity-30',
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {monthNames[displayMonth]} {displayYear}
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day names */}
            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {dayNames.map((d) => (
                <div
                  key={d}
                  className="flex h-6 w-6 items-center justify-center text-[9px] font-bold text-gray-400"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => day && handleSelect(day)}
                  disabled={!day || isDayDisabled(day)}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded text-[11px] font-medium transition-colors',
                    !day && 'opacity-0',
                    day && isDayDisabled(day) && 'cursor-not-allowed opacity-30',
                    day && !isDayDisabled(day) && value === isoForDay(day)
                      ? 'bg-blue-600 text-white'
                      : day &&
                          !isDayDisabled(day) &&
                          'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                  )}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Clear button */}
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="mt-2 w-full rounded py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Clear
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
