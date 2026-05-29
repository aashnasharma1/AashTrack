'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Lottie from 'lottie-react';
import { Pencil, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCoffeeTracker } from '@/hooks/useCoffeeTracker';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const coffeeData = require('@/app/public/lottie/1ec02070-1176-11ee-abd5-6b19bf1ba0e3.json');

interface CoffeeProgressProps {
  isCollapsed: boolean;
}

export function CoffeeProgress({ isCollapsed }: CoffeeProgressProps) {
  const { goal, progress, showCelebration, setGoal, resetCycle, dismissCelebration, mounted } =
    useCoffeeTracker();

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(goal));

  useEffect(() => {
    setGoalDraft(String(goal));
  }, [goal]);

  const saveGoal = () => {
    const val = parseInt(goalDraft, 10);
    if (!isNaN(val) && val >= 1) setGoal(val);
    else setGoalDraft(String(goal));
    setEditingGoal(false);
  };

  const pct = Math.min(100, (progress / goal) * 100);
  const isComplete = progress >= goal;

  if (!mounted) return null;

  /* ── Collapsed view ── */
  if (isCollapsed) {
    return (
      <div className="flex justify-center py-2">
        <div
          title={`Coffee goal: ${progress}/${goal}`}
          className={cn('transition-all', !isComplete && 'opacity-40 grayscale')}
        >
          <Lottie
            animationData={coffeeData}
            autoplay={isComplete}
            loop={isComplete}
            style={{ width: 28, height: 28 }}
          />
        </div>
      </div>
    );
  }

  /* ── Expanded view ── */
  return (
    <>
      <div className="px-3 py-3">
        {/* Header row */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            ☕ Coffee Goal
          </span>

          <div className="flex items-center gap-1">
            {editingGoal ? (
              <>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  onBlur={saveGoal}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveGoal();
                    if (e.key === 'Escape') {
                      setGoalDraft(String(goal));
                      setEditingGoal(false);
                    }
                  }}
                  autoFocus
                  className="w-12 rounded border border-blue-400 bg-white px-1.5 py-0.5 text-center text-xs outline-none dark:bg-gray-800 dark:text-gray-100"
                />
                <button onClick={saveGoal} className="text-blue-500 hover:text-blue-700">
                  <Check className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <span className="text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400">
                  {progress}/{goal}
                </span>
                <button
                  onClick={() => setEditingGoal(true)}
                  aria-label="Edit goal"
                  title="Set goal"
                  className="ml-1 rounded p-0.5 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress track + Lottie */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  isComplete ? 'bg-blue-500' : 'bg-blue-400/70',
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div
            className={cn(
              '-mr-1 shrink-0 transition-all duration-500',
              !isComplete && 'opacity-40 grayscale',
              isComplete && 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]',
            )}
          >
            <Lottie
              animationData={coffeeData}
              autoplay={isComplete}
              loop={isComplete}
              style={{ width: 40, height: 40 }}
            />
          </div>
        </div>

        {/* Sub-text */}
        <div className="mt-1.5 flex items-center justify-between">
          {isComplete ? (
            <p className="text-[10px] font-semibold text-blue-500">
              You&apos;ve earned your coffee!
            </p>
          ) : (
            <p className="text-[10px] text-gray-400 dark:text-gray-600">
              {goal - progress} task{goal - progress !== 1 ? 's' : ''} to go
            </p>
          )}
          {isComplete && (
            <button
              onClick={resetCycle}
              title="Start a new challenge"
              className="flex items-center gap-0.5 rounded text-[10px] font-medium text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              New
            </button>
          )}
        </div>
      </div>

      {/* ── Celebration overlay ── */}
      {showCelebration &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9500] flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              onClick={dismissCelebration}
            />

            {/* Card */}
            <div className="relative z-10 mx-4 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
              {/* Warm glow blobs */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-100/60 blur-3xl dark:bg-blue-900/25" />
                <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-blue-100/40 blur-3xl dark:bg-blue-900/15" />
              </div>

              <div className="relative p-8 text-center">
                {/* Lottie */}
                <div className="mx-auto w-fit">
                  <Lottie
                    animationData={coffeeData}
                    autoplay
                    loop
                    style={{ width: 176, height: 176 }}
                  />
                </div>

                <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                  You&apos;ve earned your coffee! ☕
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  You crushed {goal} task{goal !== 1 ? 's' : ''} in this session.
                  <br />
                  Go get that coffee — you deserve it.
                </p>

                <button
                  onClick={() => {
                    resetCycle();
                    dismissCelebration();
                  }}
                  className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 active:scale-[0.98]"
                >
                  Claim my coffee ☕
                </button>
                <button
                  onClick={dismissCelebration}
                  className="mt-3 text-xs text-gray-400 underline-offset-2 transition-colors hover:text-gray-600 hover:underline dark:hover:text-gray-300"
                >
                  Remind me later
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
