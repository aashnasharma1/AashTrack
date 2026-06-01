'use client';

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { X, ArrowRight, CheckCheck } from 'lucide-react';

const STORAGE_KEY = 'aashtrack_tour_v1';
const PAD = 8;
const TOOLTIP_W = 296;

interface Step {
  target: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const DASHBOARD_STEPS: Step[] = [
  {
    target: 'dashboard-timeline',
    title: 'Daily Timeline',
    description:
      'Drag tasks to reschedule. Ctrl+scroll to zoom. Resize by dragging the right edge of any block.',
    placement: 'bottom',
  },
  {
    target: 'dashboard-workload',
    title: 'Workload by Status',
    description:
      'Task counts per status at a glance. Bars update live as tasks move through your workflow.',
    placement: 'bottom',
  },
  {
    target: 'dashboard-tracker',
    title: 'Time Tracker',
    description:
      'Click a task to start the timer. Sessions save automatically — view the full log in History.',
    placement: 'bottom',
  },
];

const COLLECTION_STEPS: Step[] = [
  {
    target: 'new-task',
    title: 'Create a task',
    description:
      'Click here — or press N anywhere — to add a new task. Set its title, priority, schedule, and collection.',
    placement: 'bottom',
  },
  {
    target: 'view-toggle',
    title: 'Switch views',
    description:
      'Toggle between Grouped (by status), Kanban board (drag & drop between columns), and Table views.',
    placement: 'bottom',
  },
  {
    target: 'filter-bar',
    title: 'Filter & sort',
    description:
      'Narrow your task list by status, priority, or collection. Sort by date, priority level, or a custom order you define.',
    placement: 'bottom',
  },
  {
    target: 'sidebar-collections',
    title: 'Collections',
    description:
      'Group related tasks into collections — like projects or areas of focus. Each collection has its own dedicated view.',
    placement: 'right',
  },
  {
    target: 'shortcuts',
    title: 'Keyboard shortcuts',
    description:
      "Click here or press ? to see all shortcuts. N creates a task instantly — you'll use it more than the mouse.",
    placement: 'bottom',
  },
];

const getStepsForPage = (pathname: string): Step[] => {
  if (pathname === '/') return DASHBOARD_STEPS;
  if (pathname.startsWith('/collections')) return COLLECTION_STEPS;
  return [];
};

const TOOLTIP_H = 180; // estimated tooltip height for collision checks

function calcTooltipStyle(rect: DOMRect, placement: Step['placement']): CSSProperties {
  const cy = rect.top + rect.height / 2;
  const left = Math.max(
    12,
    Math.min(rect.left + rect.width / 2 - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - 12),
  );
  const gap = PAD + 10;

  switch (placement) {
    case 'bottom': {
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      if (spaceBelow >= TOOLTIP_H || spaceBelow >= spaceAbove) {
        // Enough room below (or more room below than above) — place below, clamped
        return {
          position: 'fixed',
          top: Math.min(rect.bottom + gap, window.innerHeight - TOOLTIP_H - 12),
          left,
          width: TOOLTIP_W,
          zIndex: 9999,
        };
      }
      // Flip above
      return {
        position: 'fixed',
        top: Math.max(12, rect.top - TOOLTIP_H - gap),
        left,
        width: TOOLTIP_W,
        zIndex: 9999,
      };
    }
    case 'top':
      return {
        position: 'fixed',
        top: Math.max(12, rect.top - TOOLTIP_H - gap),
        left,
        width: TOOLTIP_W,
        zIndex: 9999,
      };
    case 'right':
      return {
        position: 'fixed',
        top: Math.max(12, Math.min(cy - 80, window.innerHeight - TOOLTIP_H - 12)),
        left: rect.right + gap,
        width: TOOLTIP_W,
        zIndex: 9999,
      };
    case 'left':
      return {
        position: 'fixed',
        top: Math.max(12, Math.min(cy - 80, window.innerHeight - TOOLTIP_H - 12)),
        right: window.innerWidth - rect.left + gap,
        width: TOOLTIP_W,
        zIndex: 9999,
      };
  }
}

export function OnboardingTour() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem(STORAGE_KEY)) setActive(true);
  }, []);

  // Listen for external retrigger (dispatched by the header button)
  useEffect(() => {
    const restart = () => {
      localStorage.removeItem(STORAGE_KEY);
      setStep(0);
      setRect(null);
      setActive(true);
    };
    window.addEventListener('aashtrack:start-tour', restart);
    return () => window.removeEventListener('aashtrack:start-tour', restart);
  }, []);

  const findRect = useCallback(
    (s: number) => {
      const steps = getStepsForPage(pathname);
      const target = steps[s]?.target;
      if (!target) return;
      const attempt = () => {
        const el = document.querySelector(`[data-tour="${target}"]`);
        if (el) setRect(el.getBoundingClientRect());
        else setRect(null);
      };
      attempt();
      // Retry after paint in case element is still mounting
      requestAnimationFrame(attempt);
    },
    [pathname],
  );

  useEffect(() => {
    if (!active) return;
    findRect(step);
  }, [active, step, findRect, pathname]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => findRect(step);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active, step, findRect]);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
    setActive(false);
  }, []);

  const next = useCallback(() => {
    const steps = getStepsForPage(pathname);
    if (step < steps.length - 1) setStep((s) => s + 1);
    else finish();
  }, [step, finish, pathname]);

  const steps = getStepsForPage(pathname);
  if (!active || !mounted || steps.length === 0 || !rect) return null;

  const s = steps[step];
  const sx = rect.left - PAD;
  const sy = rect.top - PAD;
  const sw = rect.width + PAD * 2;
  const sh = rect.height + PAD * 2;

  return createPortal(
    <>
      {/* Interaction blocker */}
      <div className="fixed inset-0" style={{ zIndex: 9988 }} />

      {/* SVG spotlight overlay */}
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 h-full w-full"
        style={{ zIndex: 9989 }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={sx} y={sy} width={sw} height={sh} rx="8" fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.58)" mask="url(#tour-spotlight-mask)" />
        <rect
          x={sx}
          y={sy}
          width={sw}
          height={sh}
          rx="8"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Tooltip card */}
      <div
        style={calcTooltipStyle(rect, s.placement)}
        className="rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        role="dialog"
        aria-label={`Tour step ${step + 1} of ${steps.length}: ${s.title}`}
      >
        {/* Progress + close */}
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-5 bg-blue-500'
                    : i < step
                      ? 'w-1.5 bg-blue-200 dark:bg-blue-800'
                      : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <button
            onClick={finish}
            aria-label="Skip tour"
            className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-2 pt-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">
            Step {step + 1} of {steps.length}
          </p>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{s.title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {s.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 pb-4 pt-2">
          <button
            onClick={finish}
            className="text-xs text-gray-400 underline-offset-2 transition-colors hover:text-gray-600 hover:underline dark:hover:text-gray-300"
          >
            Skip tour
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {step < steps.length - 1 ? (
              <>
                Next <ArrowRight className="h-3 w-3" />
              </>
            ) : (
              <>
                Done <CheckCheck className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
