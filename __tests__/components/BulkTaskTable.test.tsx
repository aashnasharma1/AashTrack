import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { BulkTaskTable, type BulkRow } from '@/components/task/BulkTaskTable';
import { DEFAULT_STATUS_GROUPS, type Collection } from '@/types/task';

const collections: Collection[] = [
  { id: '1', name: 'Work', slug: 'work', createdAt: '2026-06-01T00:00:00.000Z' },
  { id: '2', name: 'Personal', slug: 'personal', createdAt: '2026-06-01T00:00:00.000Z' },
];

const row = (overrides: Partial<BulkRow> = {}): BulkRow => ({
  id: 'row-1',
  title: 'Bulk task',
  priority: 'low',
  status: 'todo',
  collection: 'work',
  startTime: '10:00',
  startDate: '2026-06-01',
  endTime: '10:30',
  endDate: '2026-06-01',
  durationMin: 30,
  ...overrides,
});

function renderTable(overrides: Partial<ComponentProps<typeof BulkTaskTable>> = {}) {
  const props = {
    rows: [row()],
    statusGroups: DEFAULT_STATUS_GROUPS,
    collections,
    validCount: 1,
    onUpdateRow: vi.fn(),
    onRemoveRow: vi.fn(),
    onAddRows: vi.fn(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };

  render(<BulkTaskTable {...props} />);
  return props;
}

describe('BulkTaskTable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T08:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders editable bulk rows and submit summary', () => {
    renderTable();

    expect(screen.getByDisplayValue('Bulk task')).toBeInTheDocument();
    expect(screen.getByText('1 of 1 rows will be created')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create 1 tasks/i })).toBeEnabled();
  });

  it('updates title, priority, status, and collection fields', () => {
    const props = renderTable();

    fireEvent.change(screen.getByPlaceholderText('Task name'), {
      target: { value: 'Renamed task' },
    });
    expect(props.onUpdateRow).toHaveBeenCalledWith('row-1', {
      title: 'Renamed task',
      titleError: undefined,
    });

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'high' } });
    fireEvent.change(selects[1], { target: { value: 'done' } });
    fireEvent.change(selects[2], { target: { value: 'personal' } });

    expect(props.onUpdateRow).toHaveBeenCalledWith('row-1', { priority: 'high' });
    expect(props.onUpdateRow).toHaveBeenCalledWith('row-1', { status: 'done' });
    expect(props.onUpdateRow).toHaveBeenCalledWith('row-1', { collection: 'personal' });
  });

  it('recalculates end time when start time, date, or duration changes', () => {
    const props = renderTable();
    const timeInput = screen.getByDisplayValue('10:00');
    const dateInput = screen.getByDisplayValue('2026-06-01');
    const durationSelect = screen.getAllByRole('combobox')[3];

    fireEvent.change(timeInput, { target: { value: '11:15' } });
    expect(props.onUpdateRow).toHaveBeenCalledWith('row-1', {
      startTime: '11:15',
      endTime: '11:45',
      endDate: '2026-06-01',
      scheduleError: undefined,
    });

    fireEvent.change(dateInput, { target: { value: '2026-06-02' } });
    expect(props.onUpdateRow).toHaveBeenCalledWith('row-1', {
      startDate: '2026-06-02',
      endTime: '10:30',
      endDate: '2026-06-02',
      scheduleError: undefined,
    });

    fireEvent.change(durationSelect, { target: { value: '120' } });
    expect(props.onUpdateRow).toHaveBeenCalledWith('row-1', {
      durationMin: 120,
      endTime: '12:00',
      endDate: '2026-06-01',
      scheduleError: undefined,
    });
  });

  it('shows row schedule errors only for titled rows', () => {
    renderTable({
      rows: [
        row({ scheduleError: 'Start time is in the past' }),
        row({ id: 'row-2', title: '', scheduleError: 'Hidden until titled' }),
      ],
    });

    expect(screen.getByText(/some rows have scheduling errors/i)).toBeInTheDocument();
    expect(screen.getByText(/row 1: start time is in the past/i)).toBeInTheDocument();
    expect(screen.queryByText(/hidden until titled/i)).not.toBeInTheDocument();
  });

  it('handles empty and locked collection states', () => {
    const { rerender } = render(
      <BulkTaskTable
        rows={[row({ collection: '' })]}
        statusGroups={DEFAULT_STATUS_GROUPS}
        collections={[]}
        validCount={0}
        onUpdateRow={vi.fn()}
        onRemoveRow={vi.fn()}
        onAddRows={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText('No collections')).toBeInTheDocument();
    expect(screen.getByText('Fill in at least one valid row to create tasks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create tasks/i })).toBeDisabled();

    rerender(
      <BulkTaskTable
        rows={[row()]}
        statusGroups={DEFAULT_STATUS_GROUPS}
        collections={collections}
        lockedCollection="work"
        validCount={1}
        onUpdateRow={vi.fn()}
        onRemoveRow={vi.fn()}
        onAddRows={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const header = screen.getAllByRole('row')[0];
    expect(within(header).queryByText('Collection')).not.toBeInTheDocument();
  });

  it('calls footer and row action handlers', () => {
    const props = renderTable();

    fireEvent.click(screen.getByRole('button', { name: /remove row/i }));
    fireEvent.click(screen.getByRole('button', { name: /5 more rows/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /create 1 tasks/i }));

    expect(props.onRemoveRow).toHaveBeenCalledWith('row-1');
    expect(props.onAddRows).toHaveBeenCalled();
    expect(props.onCancel).toHaveBeenCalled();
    expect(props.onSubmit).toHaveBeenCalled();
  });
});
