'use client';

import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['N'], description: 'New task' },
  { keys: ['/'], description: 'Focus search' },
  { keys: ['Esc'], description: 'Close modal / panel' },
  { keys: ['?'], description: 'Show this help' },
  { keys: ['Tab'], description: 'Navigate between fields' },
  { keys: ['Enter'], description: 'Submit form' },
];

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-start sm:justify-end sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="animate-in fade-in-0 zoom-in-95 relative w-72 rounded-xl border border-gray-200 bg-white shadow-2xl duration-150 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <Keyboard className="h-4 w-4 text-blue-500" aria-hidden="true" />
            Keyboard shortcuts
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts"
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="divide-y divide-gray-100 px-1 py-1 dark:divide-gray-800">
          {SHORTCUTS.map(({ keys, description }) => (
            <li key={description} className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{description}</span>
              <div className="flex items-center gap-1">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border border-gray-300 bg-gray-50 px-1.5 font-mono text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <p className="px-4 py-2.5 text-center text-xs text-gray-400 dark:text-gray-600">
          Press <kbd className="font-mono">?</kbd> anytime to show this
        </p>
      </div>
    </div>
  );
}
