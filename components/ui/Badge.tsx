import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Flag } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Priority, StatusGroup } from '@/types/task';
import { PRIORITY_LABELS } from '@/types/task';

// ── Priority flag ─────────────────────────────────────────────────────────────

const FLAG_COLORS: Record<Priority, string> = {
  high: 'text-red-500 fill-red-500',
  medium: 'text-amber-400 fill-amber-400',
  low: 'text-gray-300 fill-gray-300 dark:text-gray-500 dark:fill-gray-500',
};

export function PriorityFlag({ priority, className }: { priority: Priority; className?: string }) {
  const label = `${PRIORITY_LABELS[priority]} priority`;
  return (
    <span title={label} aria-label={label} className="inline-flex shrink-0">
      <Flag
        className={cn('h-3.5 w-3.5', FLAG_COLORS[priority], className)}
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </span>
  );
}

export { PriorityFlag as PriorityBadge };

// ── Priority selector (inline popover) ───────────────────────────────────────

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

interface PrioritySelectorProps {
  priority: Priority;
  onChange: (p: Priority) => void;
  className?: string;
}

export function PrioritySelector({ priority, onChange, className }: PrioritySelectorProps) {
  const [open, setOpen] = useState(false);
  const [popStyle, setPopStyle] = useState<CSSProperties>({});
  const trigRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const openDropdown = () => {
    if (!trigRef.current) return;
    const rect = trigRef.current.getBoundingClientRect();
    const dropH = 116;
    const spaceBelow = window.innerHeight - rect.bottom;
    const above = spaceBelow < dropH && rect.top > dropH;
    setPopStyle({
      position: 'fixed',
      zIndex: 9999,
      minWidth: 124,
      ...(above
        ? { bottom: window.innerHeight - rect.top + 4, left: rect.left }
        : { top: rect.bottom + 4, left: rect.left }),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current?.contains(e.target as Node)) return;
      if (trigRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <div className={cn('inline-flex', className)}>
      <button
        ref={trigRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        title={`Priority: ${PRIORITY_LABELS[priority]}`}
        className="rounded p-0.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <PriorityFlag priority={priority} />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popRef}
            style={popStyle}
            className="rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900"
          >
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                  p === priority && 'bg-gray-50 dark:bg-gray-800',
                )}
              >
                <PriorityFlag priority={p} />
                {PRIORITY_LABELS[p]}
                {p === priority && <span className="ml-auto text-blue-500">✓</span>}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const base =
  'inline-flex items-center rounded-full whitespace-nowrap border px-2 py-0.5 text-xs font-medium';

function groupStyle(color: string): React.CSSProperties {
  return {
    borderColor: `${color}50`,
    backgroundColor: `${color}18`,
    color,
  };
}

export function StatusBadge({
  status,
  groups,
  className,
}: {
  status: string;
  groups?: StatusGroup[];
  className?: string;
}) {
  const group = groups?.find((g) => g.id === status);
  const label = group?.label ?? status;
  const style = group ? groupStyle(group.color) : undefined;

  return (
    <span className={cn(base, className)} style={style}>
      {label}
    </span>
  );
}

// ── Clickable status badge ─────────────────────────────────────────────────────

interface ClickableStatusBadgeProps {
  status: string;
  groups: StatusGroup[];
  onCycle: (next: string) => void;
  className?: string;
}

export function ClickableStatusBadge({
  status,
  groups,
  onCycle,
  className,
}: ClickableStatusBadgeProps) {
  const idx = groups.findIndex((g) => g.id === status);
  const current = groups[idx] ?? { id: status, label: status, color: '#6b7280', isDefault: false };
  const next = groups[(idx + 1) % groups.length] ?? groups[0];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCycle(next?.id ?? status);
      }}
      aria-label={`Status: ${current.label}. Click to change to ${next?.label ?? current.label}`}
      title={`Click to mark as ${next?.label ?? current.label}`}
      style={groupStyle(current.color)}
      className={cn(
        base,
        'cursor-pointer transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        className,
      )}
    >
      {current.label}
    </button>
  );
}
