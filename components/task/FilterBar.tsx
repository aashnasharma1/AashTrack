'use client';

import { X, ChevronDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { FilterState, SortState, Status, Priority, SortBy } from '@/types/task';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/types/task';

interface FilterBarProps {
  filter: FilterState;
  sort: SortState;
  taskCount: number;
  filteredCount: number;
  collections: string[];
  onFilterChange: (f: Partial<FilterState>) => void;
  onSortChange: (s: Partial<SortState>) => void;
  onClearFilters: () => void;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'todo', label: STATUS_LABELS['todo'] },
  { value: 'in-progress', label: STATUS_LABELS['in-progress'] },
  { value: 'done', label: STATUS_LABELS['done'] },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: PRIORITY_LABELS['high'] },
  { value: 'medium', label: PRIORITY_LABELS['medium'] },
  { value: 'low', label: PRIORITY_LABELS['low'] },
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
}

function FilterChip({ label, active, activeLabel, onClear, children }: FilterChipProps) {
  return (
    <div className="relative">
      <details className="group">
        <summary
          className={cn(
            'flex cursor-pointer select-none list-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            active
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800',
          )}
        >
          {active && activeLabel ? (
            <>
              <span>{activeLabel}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onClear();
                }}
                aria-label={`Clear ${label} filter`}
                className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-900"
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
        <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {children}
        </div>
      </details>
    </div>
  );
}

export function FilterBar({
  filter,
  sort,
  taskCount,
  filteredCount,
  collections,
  onFilterChange,
  onSortChange,
  onClearFilters,
}: FilterBarProps) {
  const hasActive = filter.status !== '' || filter.priority !== '' || filter.collection !== '';
  const sortOrderLabel = sort.sortOrder === 'asc' ? '↑' : '↓';

  const close = () => document.querySelector('details[open]')?.removeAttribute('open');

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Count */}
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {hasActive ? (
          <>
            <span className="font-medium text-gray-900 dark:text-gray-100">{filteredCount}</span>
            {' of '}
            <span>{taskCount}</span>
            {' tasks'}
          </>
        ) : (
          <>
            <span className="font-medium text-gray-900 dark:text-gray-100">{taskCount}</span>
            {' task'}
            {taskCount !== 1 ? 's' : ''}
          </>
        )}
      </span>

      <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

      {/* Collection filter */}
      {collections.length > 0 && (
        <FilterChip
          label="Collection"
          active={filter.collection !== ''}
          activeLabel={filter.collection || undefined}
          onClear={() => onFilterChange({ collection: '' })}
        >
          {collections.map((c) => (
            <button
              key={c}
              onClick={() => {
                onFilterChange({ collection: filter.collection === c ? '' : c });
                close();
              }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                filter.collection === c
                  ? 'font-medium text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-700 dark:text-gray-300',
              )}
              aria-pressed={filter.collection === c}
            >
              {c}
              {filter.collection === c && <span className="text-indigo-500">✓</span>}
            </button>
          ))}
        </FilterChip>
      )}

      {/* Status filter */}
      <FilterChip
        label="Status"
        active={filter.status !== ''}
        activeLabel={filter.status ? STATUS_LABELS[filter.status] : undefined}
        onClear={() => onFilterChange({ status: '' })}
      >
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              onFilterChange({ status: filter.status === opt.value ? '' : opt.value });
              close();
            }}
            className={cn(
              'flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
              filter.status === opt.value
                ? 'font-medium text-indigo-600 dark:text-indigo-400'
                : 'text-gray-700 dark:text-gray-300',
            )}
            aria-pressed={filter.status === opt.value}
          >
            {opt.label}
            {filter.status === opt.value && <span className="text-indigo-500">✓</span>}
          </button>
        ))}
      </FilterChip>

      {/* Priority filter */}
      <FilterChip
        label="Priority"
        active={filter.priority !== ''}
        activeLabel={filter.priority ? PRIORITY_LABELS[filter.priority] : undefined}
        onClear={() => onFilterChange({ priority: '' })}
      >
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              onFilterChange({ priority: filter.priority === opt.value ? '' : opt.value });
              close();
            }}
            className={cn(
              'flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
              filter.priority === opt.value
                ? 'font-medium text-indigo-600 dark:text-indigo-400'
                : 'text-gray-700 dark:text-gray-300',
            )}
            aria-pressed={filter.priority === opt.value}
          >
            {opt.label}
            {filter.priority === opt.value && <span className="text-indigo-500">✓</span>}
          </button>
        ))}
      </FilterChip>

      {/* Sort */}
      <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-900">
        <ArrowUpDown className="h-3 w-3 text-gray-400" aria-hidden="true" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Sort:</span>
        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                if (sort.sortBy === opt.value) {
                  onSortChange({ sortOrder: sort.sortOrder === 'asc' ? 'desc' : 'asc' });
                } else {
                  onSortChange({ sortBy: opt.value as SortBy, sortOrder: 'desc' });
                }
              }}
              className={cn(
                'rounded px-1.5 py-0.5 text-xs font-medium transition-colors',
                sort.sortBy === opt.value
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300',
              )}
            >
              {opt.label}
              {sort.sortBy === opt.value && <span className="ml-0.5">{sortOrderLabel}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Clear all */}
      {hasActive && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Clear all filters"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
