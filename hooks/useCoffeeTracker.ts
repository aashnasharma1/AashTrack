'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import type { Task } from '@/types/task';

const STORAGE_KEY = 'aashtrack_coffee_v1';

interface CoffeeState {
  goal: number;
  progress: number;
  celebrated: boolean;
}

const DEFAULT: CoffeeState = { goal: 5, progress: 0, celebrated: false };

export function useCoffeeTracker() {
  const {
    state: { tasks },
  } = useTaskContext();

  const [coffeeState, setCoffeeState] = useState<CoffeeState>(DEFAULT);
  const [showCelebration, setShowCelebration] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevTasksRef = useRef<Task[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CoffeeState>;
        setCoffeeState({
          goal: typeof parsed.goal === 'number' ? Math.max(1, parsed.goal) : DEFAULT.goal,
          progress: typeof parsed.progress === 'number' ? parsed.progress : DEFAULT.progress,
          celebrated:
            typeof parsed.celebrated === 'boolean' ? parsed.celebrated : DEFAULT.celebrated,
        });
      }
    } catch {
      // ignore
    }
    // Snapshot current tasks so we don't count existing done tasks as "new"
    prevTasksRef.current = tasks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

  // Persist state
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coffeeState));
    } catch {
      // ignore
    }
  }, [coffeeState, mounted]);

  // Detect task → 'done' transitions
  useEffect(() => {
    if (!mounted) return;
    const prev = prevTasksRef.current;
    let newlyDone = 0;
    for (const task of tasks) {
      if (task.status === 'done') {
        const prevTask = prev.find((p) => p.id === task.id);
        // Only count if the task existed previously with a non-done status
        if (prevTask && prevTask.status !== 'done') newlyDone++;
      }
    }
    if (newlyDone > 0) {
      setCoffeeState((cs) => {
        const newProgress = cs.progress + newlyDone;
        const reachedGoal = !cs.celebrated && newProgress >= cs.goal;
        if (reachedGoal) setShowCelebration(true);
        return {
          ...cs,
          progress: newProgress,
          celebrated: cs.celebrated || reachedGoal,
        };
      });
    }
    prevTasksRef.current = tasks;
  }, [tasks, mounted]);

  const setGoal = useCallback((goal: number) => {
    const clamped = Math.max(1, goal);
    setCoffeeState((cs) => ({
      ...cs,
      goal: clamped,
      // Un-celebrate if the new goal is higher than current progress
      celebrated: cs.progress >= clamped ? cs.celebrated : false,
    }));
  }, []);

  const resetCycle = useCallback(() => {
    setCoffeeState((cs) => ({ ...cs, progress: 0, celebrated: false }));
  }, []);

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  return {
    goal: coffeeState.goal,
    progress: coffeeState.progress,
    celebrated: coffeeState.celebrated,
    showCelebration,
    setGoal,
    resetCycle,
    dismissCelebration,
    mounted,
  };
}
