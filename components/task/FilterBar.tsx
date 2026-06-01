'use client';

import { useEffect } from 'react';
import { X, ChevronDown, ArrowUpDown, CircleDashed, Flag, Layers } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTaskContext } from '@/context/TaskContext';
import { PriorityBadge } from '@/components/ui/Badge';
import type { Collection, FilterState, SortState, Priority, SortBy } from '@/types/task';
import { PRIORITY_LABELS } from '@/types/task';

interface FilterBarProps {
  filter: FilterState;
  sort: SortState;
  collections: Collection[];
  isSearchActive?: boolean;
  onFilterChange: (f: Partial<FilterState>) => void;
  onSortChange: (s: Partial<SortState>) => void;
  onClearFilters: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; flagCls: string }[] = [
  { value: 'high', label: PRIORITY_LABELS['high'], flagCls: 'text-red-500' },
  { value: 'medium', label: PRIORITY_LABELS['medium'], flagCls: 'text-yellow-500' },
  { value: 'low', label: PRIORITY_LABELS['low'], flagCls: 'text-blue-500' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'createdAt', label: 'Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
];

interface FilterChipProps {
  label: string;
  active: boolean;
  activeLabel?: string;
  onClear: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function FilterChip({ label, active, activeLabel, onClear, icon, children }: FilterChipProps) {
  return (
    <div className="relative">
      <details className="group">
        <summary
          className={cn(
            'flex cursor-pointer select-none list-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
            active
              ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800',
          )}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          {active && activeLabel ? (
            <>
              <span>{activeLabel}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onClear();
                }}
                aria-label={`Clear ${label} filter`}
                className="ml-0.5 rounded-full p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </>
          ) : (
            <>
              <span>{label}</span>
              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
            </>
          )}
        </summary>
        <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {children}
        </div>
      </details>
    </div>
  );
}

export function FilterBar({
  filter,
  sort,
  collections,
  isSearchActive,
  onFilterChange,
  onSortChange,
  onClearFilters,
}: FilterBarProps) {
  const {
    state: { statusGroups },
  } = useTaskContext();
  const hasActive =
    filter.status !== '' || filter.priority !== '' || filter.collection !== '' || !!isSearchActive;
  const sortOrderLabel = sort.sortOrder === 'asc' ? '↑' : '↓';

  const close = () => document.querySelector('details[open]')?.removeAttribute('open');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('details[open]').forEach((el) => el.removeAttribute('open'));
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Collection filter */}
      {collections.length > 0 && (
        <FilterChip
          label="Collection"
          active={filter.collection !== ''}
          activeLabel={collections.find((c) => c.slug === filter.collection)?.name || undefined}
          onClear={() => onFilterChange({ collection: '' })}
          icon={<Layers className="h-3 w-3" aria-hidden="true" />}
        >
          {collections.map((c) => (
            <button
              key={c.slug}
              onClick={() => {
                onFilterChange({ collection: filter.collection === c.slug ? '' : c.slug });
                close();
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                filter.collection === c.slug
                  ? 'font-medium text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300',
              )}
              aria-pressed={filter.collection === c.slug}
            >
              <Layers className="h-3 w-3 shrink-0 text-gray-400" aria-hidden="true" />
              {c.name}
              {filter.collection === c.slug && <span className="ml-auto text-blue-500">✓</span>}
            </button>
          ))}
        </FilterChip>
      )}

      {/* Status filter */}
      <FilterChip
        label="Status"
        active={filter.status !== ''}
        activeLabel={statusGroups.find((g) => g.id === filter.status)?.label}
        onClear={() => onFilterChange({ status: '' })}
        icon={<CircleDashed className="h-3 w-3" aria-hidden="true" />}
      >
        {statusGroups.map((grp) => (
          <button
            key={grp.id}
            onClick={() => {
              onFilterChange({ status: filter.status === grp.id ? '' : grp.id });
              close();
            }}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
              filter.status === grp.id
                ? 'font-medium text-gray-900 dark:text-gray-100'
                : 'text-gray-700 dark:text-gray-300',
            )}
            aria-pressed={filter.status === grp.id}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: grp.color }}
              aria-hidden="true"
            />
            {grp.label}
            {filter.status === grp.id && <span className="ml-auto text-blue-500">✓</span>}
          </button>
        ))}
      </FilterChip>

      {/* Priority filter */}
      <FilterChip
        label="Priority"
        active={filter.priority !== ''}
        activeLabel={filter.priority ? PRIORITY_LABELS[filter.priority] : undefined}
        onClear={() => onFilterChange({ priority: '' })}
        icon={<Flag className="h-3 w-3" aria-hidden="true" />}
      >
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              onFilterChange({ priority: filter.priority === opt.value ? '' : opt.value });
              close();
            }}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
              filter.priority === opt.value
                ? 'font-medium text-gray-900 dark:text-gray-100'
                : 'text-gray-700 dark:text-gray-300',
            )}
            aria-pressed={filter.priority === opt.value}
          >
            <Flag className={cn('h-3.5 w-3.5 shrink-0', opt.flagCls)} aria-hidden="true" />
            <PriorityBadge priority={opt.value} />
            {filter.priority === opt.value && <span className="ml-auto text-blue-500">✓</span>}
          </button>
        ))}
      </FilterChip>

      {/* Sort */}
      <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-900">
        <ArrowUpDown className="h-3 w-3 text-gray-400" aria-hidden="true" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Sort:</span>
        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map((opt) => {
            const isActive = sort.sortBy === opt.value;
            const directionLabel = isActive
              ? sort.sortOrder === 'asc'
                ? ', ascending'
                : ', descending'
              : '';
            return (
              <button
                key={opt.value}
                onClick={() => {
                  if (isActive) {
                    onSortChange({ sortOrder: sort.sortOrder === 'asc' ? 'desc' : 'asc' });
                  } else {
                    onSortChange({ sortBy: opt.value as SortBy, sortOrder: 'desc' });
                  }
                }}
                aria-label={`Sort by ${opt.label}${directionLabel}`}
                aria-pressed={isActive}
                className={cn(
                  'rounded px-1.5 py-0.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300',
                )}
              >
                {opt.label}
                {isActive && (
                  <span className="ml-0.5" aria-hidden="true">
                    {sortOrderLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear all */}
      {hasActive && (
        <button
          onClick={() => {
            onClearFilters();
          }}
          className="flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Clear all filters and search"
        >
          <X className="h-3 w-3" />
          Clear all
        </button>
      )}
    </div>
  );
}
