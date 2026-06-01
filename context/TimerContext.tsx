'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { z } from 'zod';
import { readStorage, writeStorage } from '@/lib/storage';

const STORAGE_KEY = 'aashtrack_timer_v1';

export interface SessionRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  durationSecs: number;
  stoppedAt: string;
}

interface TimerState {
  activeTaskId: string | null;
  activeTaskTitle: string;
  isPaused: boolean;
  startedAt: number | null;
  elapsedSecs: number;
  history: SessionRecord[];
}

const EMPTY: TimerState = {
  activeTaskId: null,
  activeTaskTitle: '',
  isPaused: false,
  startedAt: null,
  elapsedSecs: 0,
  history: [],
};

const timerStateSchema = z.object({
  activeTaskId: z.string().nullable(),
  activeTaskTitle: z.string(),
  isPaused: z.boolean(),
  startedAt: z.number().nullable(),
  elapsedSecs: z.number(),
  history: z.array(
    z.object({
      id: z.string(),
      taskId: z.string(),
      taskTitle: z.string(),
      durationSecs: z.number(),
      stoppedAt: z.string(),
    }),
  ),
});

interface TimerContextValue {
  activeTaskId: string | null;
  activeTaskTitle: string;
  isPaused: boolean;
  history: SessionRecord[];
  displaySecs: number;
  mounted: boolean;
  startTask: (taskId: string, taskTitle: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  clearHistory: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerState>(EMPTY);
  const [displaySecs, setDisplaySecs] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setState(readStorage(STORAGE_KEY, timerStateSchema, EMPTY));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    writeStorage(STORAGE_KEY, state);
  }, [state, mounted]);

  useEffect(() => {
    const tick = () => {
      if (state.activeTaskId && !state.isPaused && state.startedAt) {
        setDisplaySecs(Math.floor(state.elapsedSecs + (Date.now() - state.startedAt) / 1000));
      } else {
        setDisplaySecs(Math.floor(state.elapsedSecs));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state]);

  const startTask = useCallback((taskId: string, taskTitle: string) => {
    setState((prev) => ({
      ...prev,
      activeTaskId: taskId,
      activeTaskTitle: taskTitle,
      isPaused: false,
      startedAt: Date.now(),
      elapsedSecs: 0,
    }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => {
      if (!prev.activeTaskId || prev.isPaused || !prev.startedAt) return prev;
      return {
        ...prev,
        isPaused: true,
        elapsedSecs: Math.floor(prev.elapsedSecs + (Date.now() - prev.startedAt) / 1000),
        startedAt: null,
      };
    });
  }, []);

  const resume = useCallback(() => {
    setState((prev) => {
      if (!prev.activeTaskId || !prev.isPaused) return prev;
      return { ...prev, isPaused: false, startedAt: Date.now() };
    });
  }, []);

  const stop = useCallback(() => {
    setState((prev) => {
      if (!prev.activeTaskId) return prev;
      const dur = Math.floor(
        prev.elapsedSecs +
          (!prev.isPaused && prev.startedAt ? (Date.now() - prev.startedAt) / 1000 : 0),
      );
      const base = {
        ...prev,
        activeTaskId: null,
        activeTaskTitle: '',
        isPaused: false,
        startedAt: null,
        elapsedSecs: 0,
      };
      if (dur < 1) return base;
      const session: SessionRecord = {
        id: `s_${Date.now()}`,
        taskId: prev.activeTaskId!,
        taskTitle: prev.activeTaskTitle,
        durationSecs: dur,
        stoppedAt: new Date().toISOString(),
      };
      return { ...base, history: [session, ...prev.history].slice(0, 50) };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({ ...prev, history: [] }));
  }, []);

  return (
    <TimerContext.Provider
      value={{
        activeTaskId: state.activeTaskId,
        activeTaskTitle: state.activeTaskTitle,
        isPaused: state.isPaused,
        history: state.history,
        displaySecs,
        mounted,
        startTask,
        pause,
        resume,
        stop,
        clearHistory,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within a TimerProvider');
  return ctx;
}
