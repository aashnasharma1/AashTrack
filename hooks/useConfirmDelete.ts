'use client';

import { useState } from 'react';

interface UseConfirmDeleteReturn {
  confirming: boolean;
  handleDelete: () => void;
}

/**
 * Two-step delete confirmation with auto-reset after a timeout.
 * Used by TaskCard, TaskListItem, TaskBoardCard, and TaskTableRow.
 */
export function useConfirmDelete(onDelete: () => void, timeoutMs = 3000): UseConfirmDeleteReturn {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    if (confirming) {
      onDelete();
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), timeoutMs);
    }
  };

  return { confirming, handleDelete };
}
