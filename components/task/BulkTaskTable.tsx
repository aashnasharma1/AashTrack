'use client';

import { X, Plus } from 'lucide-react';
import type { Collection, Priority, StatusGroup } from '@/types/task';
import { TITLE_MAX } from '@/lib/validation';

export interface BulkRow {
  id: string;
  title: string;
  priority: Priority;
  status: string;
  collection: string;
  titleError?: string;
}

export interface BulkTaskTableProps {
  rows: BulkRow[];
  statusGroups: StatusGroup[];
  collections: Collection[];
  lockedCollection?: string;
  validCount: number;
  onUpdateRow: (id: string, patch: Partial<BulkRow>) => void;
  onRemoveRow: (id: string) => void;
  onAddRows: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function BulkTaskTable({
  rows,
  statusGroups,
  collections,
  lockedCollection,
  validCount,
  onUpdateRow,
  onRemoveRow,
  onAddRows,
  onSubmit,
  onCancel,
}: BulkTaskTableProps) {
  return (
    <div>
      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="w-7 pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                #
              </th>
              <th className="pb-2 pl-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Name *
              </th>
              <th className="w-24 pb-2 pl-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Priority
              </th>
              <th className="w-28 pb-2 pl-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Status
              </th>
              {!lockedCollection && (
                <th className="w-32 pb-2 pl-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Collection
                </th>
              )}
              <th className="w-7 pb-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className="border-b border-gray-50 dark:border-gray-800/50">
                <td className="py-1.5 text-center text-gray-400">{idx + 1}</td>
                <td className="py-1.5 pl-2">
                  <div>
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        const error =
                          newTitle.trim().length > 0 && newTitle.length > TITLE_MAX
                            ? `Task title cannot exceed ${TITLE_MAX} characters.`
                            : undefined;
                        onUpdateRow(row.id, { title: newTitle, titleError: error });
                      }}
                      maxLength={TITLE_MAX}
                      placeholder="Task name"
                      className="w-full rounded border border-gray-200 bg-transparent px-2 py-1 text-xs text-gray-900 outline-none focus:border-blue-400 dark:border-gray-700 dark:text-gray-100"
                    />
                    {row.titleError && (
                      <p className="mt-0.5 text-xs text-red-500">{row.titleError}</p>
                    )}
                    <span className="text-xs text-gray-400">
                      {row.title.length} / {TITLE_MAX}
                    </span>
                  </div>
                </td>
                <td className="py-1.5 pl-2">
                  <select
                    value={row.priority}
                    onChange={(e) => onUpdateRow(row.id, { priority: e.target.value as Priority })}
                    className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </td>
                <td className="py-1.5 pl-2">
                  <select
                    value={row.status}
                    onChange={(e) => onUpdateRow(row.id, { status: e.target.value })}
                    className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {statusGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </td>
                {!lockedCollection && (
                  <td className="py-1.5 pl-2">
                    <select
                      value={row.collection}
                      onChange={(e) => onUpdateRow(row.id, { collection: e.target.value })}
                      className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {collections.length === 0 ? (
                        <option value="">No collections</option>
                      ) : (
                        collections.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))
                      )}
                    </select>
                  </td>
                )}
                <td className="py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveRow(row.id)}
                    className="rounded p-0.5 text-gray-300 transition-colors hover:text-red-400 dark:text-gray-600"
                    aria-label="Remove row"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onAddRows}
        className="mt-2 flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-blue-500"
      >
        <Plus className="h-3.5 w-3.5" />5 more rows
      </button>

      <div className="-mx-5 mt-4 border-t border-gray-100 dark:border-gray-800" />

      <div className="flex items-center justify-between pt-4">
        <span className="text-xs text-gray-400">
          {validCount > 0
            ? `${validCount} of ${rows.length} rows will be created`
            : 'Fill in at least one name to create tasks'}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={validCount === 0}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            Create {validCount || ''} Tasks
          </button>
        </div>
      </div>
    </div>
  );
}
