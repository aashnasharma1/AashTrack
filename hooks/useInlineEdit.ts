'use client';

import { useState, useEffect, useRef } from 'react';

interface UseInlineEditOptions {
  value: string;
  onSave: (value: string) => void;
}

interface UseInlineEditReturn {
  editing: boolean;
  draft: string;
  inputRef: React.RefObject<HTMLInputElement>;
  startEditing: () => void;
  setDraft: (v: string) => void;
  save: () => void;
  cancel: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Manages inline title editing state shared by TaskCard, TaskListItem,
 * TaskBoardCard, and StatusGroupManager. Handles focus, save, and cancel.
 */
export function useInlineEdit({ value, onSave }: UseInlineEditOptions): UseInlineEditReturn {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync when the source value changes externally
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Auto-focus and select on edit start
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const startEditing = () => setEditing(true);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    }
    if (e.key === 'Escape') cancel();
  };

  return { editing, draft, inputRef, startEditing, setDraft, save, cancel, handleKeyDown };
}
