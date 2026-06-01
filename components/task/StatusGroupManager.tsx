'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { useTaskContext } from '@/context/TaskContext';
import { useInlineEdit } from '@/hooks/useInlineEdit';
import type { StatusGroup } from '@/types/task';

const COLOR_PRESETS = [
  { hex: '#f43f5e', label: 'Rose' },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#eab308', label: 'Yellow' },
  { hex: '#22c55e', label: 'Green' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#3b82f6', label: 'Blue' },
  { hex: '#8b5cf6', label: 'Violet' },
  { hex: '#ec4899', label: 'Pink' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#6b7280', label: 'Gray' },
];

// ── Color swatch picker ───────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Change color"
        className="h-5 w-5 shrink-0 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        style={{ backgroundColor: value }}
      />
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 flex w-44 flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => {
                onChange(c.hex);
                setOpen(false);
              }}
              title={c.label}
              className={cn(
                'h-5 w-5 rounded-full transition-transform hover:scale-110 focus-visible:outline-none',
                value === c.hex && 'ring-2 ring-blue-500 ring-offset-1',
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sortable group row ────────────────────────────────────────────────────────

function SortableGroupRow({
  group,
  onDelete,
  onUpdate,
}: {
  group: StatusGroup;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { label?: string; color?: string }) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
  });
  const {
    editing: editingLabel,
    draft: labelDraft,
    inputRef,
    startEditing: startEditingLabel,
    setDraft: setLabelDraft,
    save: saveLabel,
    handleKeyDown: handleLabelKeyDown,
  } = useInlineEdit({
    value: group.label,
    onSave: (v) => onUpdate(group.id, { label: v }),
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 rounded-lg px-2 py-2 transition-colors',
        isDragging ? 'opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing dark:text-gray-600 dark:hover:text-gray-400"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Color dot */}
      <ColorPicker value={group.color} onChange={(hex) => onUpdate(group.id, { color: hex })} />

      {/* Label */}
      <div className="min-w-0 flex-1">
        {editingLabel ? (
          <input
            ref={inputRef}
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={saveLabel}
            onKeyDown={handleLabelKeyDown}
            maxLength={32}
            className="w-full rounded bg-transparent px-1 text-sm font-medium text-gray-900 outline-none ring-1 ring-blue-300 dark:text-gray-100 dark:ring-blue-700"
          />
        ) : (
          <button
            type="button"
            onClick={() => !group.isDefault && startEditingLabel()}
            className={cn(
              'text-left text-sm font-medium text-gray-800 dark:text-gray-200',
              !group.isDefault && 'hover:text-blue-600 dark:hover:text-blue-400',
            )}
            title={group.isDefault ? undefined : 'Click to rename'}
          >
            {group.label}
          </button>
        )}
      </div>

      {/* Default badge */}
      {group.isDefault && (
        <span className="shrink-0 rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-700 dark:text-gray-600">
          default
        </span>
      )}

      {/* Delete — only for custom groups */}
      {!group.isDefault ? (
        <button
          type="button"
          onClick={() => onDelete(group.id)}
          aria-label={`Delete ${group.label}`}
          className="shrink-0 text-gray-300 transition-colors hover:text-red-500 dark:text-gray-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <div className="h-3.5 w-3.5 shrink-0" />
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface StatusGroupManagerProps {
  open: boolean;
  onClose: () => void;
}

export function StatusGroupManager({ open, onClose }: StatusGroupManagerProps) {
  const { state, reorderStatusGroups, addStatusGroup, deleteStatusGroup, updateStatusGroup } =
    useTaskContext();
  const groups = state.statusGroups;

  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#8b5cf6');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = groups.findIndex((g) => g.id === active.id);
    const newIdx = groups.findIndex((g) => g.id === over.id);
    reorderStatusGroups(arrayMove(groups, oldIdx, newIdx));
  };

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) return;
    addStatusGroup(label, newColor);
    setNewLabel('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Manage Categories">
      <div className="flex flex-col gap-1">
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Drag to reorder. Click a color dot to change it. Click a custom label to rename.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={groups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
            {groups.map((group) => (
              <SortableGroupRow
                key={group.id}
                group={group}
                onDelete={deleteStatusGroup}
                onUpdate={updateStatusGroup}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add new group */}
        <div className="-mx-5 mt-3 border-t border-gray-100 px-5 pt-4 dark:border-gray-800">
          <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            Add category
          </p>
          <div className="flex items-center gap-2">
            <ColorPicker value={newColor} onChange={setNewColor} />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="Category name…"
              maxLength={32}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none placeholder:text-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newLabel.trim()}
              aria-label="Add category"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
