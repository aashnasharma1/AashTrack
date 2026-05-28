'use client';

import { useCallback } from 'react';
import {
  type DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task } from '@/types/task';

interface UseTaskDndOptions {
  tasks: Task[];
  onReorder: (tasks: Task[]) => void;
}

export function useTaskDnd({ tasks, onReorder }: UseTaskDndOptions) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(tasks, oldIndex, newIndex));
      }
    },
    [tasks, onReorder],
  );

  return { sensors, handleDragEnd };
}
