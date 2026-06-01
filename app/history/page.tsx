'use client';

import { useEffect, useState } from 'react';
import { Timer, Trash2, Clock } from 'lucide-react';
import { useTimeTracker, type SessionRecord } from '@/hooks/useTimeTracker';
import { cn } from '@/lib/cn';

function fmtDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function fmtDateGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function groupByDate(sessions: SessionRecord[]): { label: string; sessions: SessionRecord[] }[] {
  const map = new Map<string, SessionRecord[]>();
  for (const s of sessions) {
    const key = new Date(s.stoppedAt).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).map(([_key, sess]) => ({
    label: fmtDateGroup(sess[0].stoppedAt),
    sessions: sess,
  }));
}

export default function HistoryPage() {
  const { history, clearHistory } = useTimeTracker();
  const [mounted, setMounted] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const groups = groupByDate(history);
  const totalSecs = history.reduce((sum, s) => sum + s.durationSecs, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Timer History</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {history.length} session{history.length !== 1 ? 's' : ''} · {fmtDuration(totalSecs)}{' '}
            total tracked
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setClearing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* Confirm clear */}
      {clearing && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
          <p className="flex-1 text-sm text-red-700 dark:text-red-400">
            Clear all {history.length} sessions? This cannot be undone.
          </p>
          <button
            onClick={() => setClearing(false)}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              clearHistory();
              setClearing(false);
            }}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Clear
          </button>
        </div>
      )}

      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-20 text-center dark:border-gray-800">
          <Timer className="h-10 w-10 text-gray-200 dark:text-gray-700" />
          <p className="text-sm text-gray-400 dark:text-gray-600">No timer sessions yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Start tracking time on a task from the dashboard.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(({ label, sessions }) => {
            const groupTotal = sessions.reduce((sum, s) => sum + s.durationSecs, 0);
            return (
              <div key={label}>
                {/* Date group header */}
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {label}
                  </h2>
                  <span className="font-mono text-xs text-gray-400 dark:text-gray-600">
                    {fmtDuration(groupTotal)}
                  </span>
                </div>

                {/* Sessions */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                  {sessions.map((session, i) => (
                    <div
                      key={session.id}
                      className={cn(
                        'flex items-center gap-4 px-4 py-3.5',
                        i < sessions.length - 1 && 'border-b border-gray-100 dark:border-gray-800',
                      )}
                    >
                      {/* Avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                        {session.taskTitle.charAt(0).toUpperCase()}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {session.taskTitle}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>Stopped at {fmtTime(session.stoppedAt)}</span>
                        </div>
                      </div>

                      {/* Duration */}
                      <span className="shrink-0 font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {fmtDuration(session.durationSecs)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
