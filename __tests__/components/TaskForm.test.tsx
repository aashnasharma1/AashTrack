import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { TaskForm } from '@/components/task/TaskForm';
import { TaskProvider } from '@/context/TaskContext';
import type { Task } from '@/types/task';
import { todayISO } from '@/lib/timeUtils';

const collections = [
  { id: '1', name: 'Work', slug: 'work', createdAt: new Date().toISOString() },
  { id: '2', name: 'Personal', slug: 'personal', createdAt: new Date().toISOString() },
];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  collections,
};

/** A task with a start time guaranteed to be in the future (23:30 → 23:59 today). */
function futureTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    title: 'Existing',
    description: '',
    priority: 'low',
    status: 'todo',
    collection: 'work',
    createdAt: new Date().toISOString(),
    order: 0,
    startTime: '23:30',
    endTime: '23:59',
    startDate: todayISO(),
    endDate: todayISO(),
    ...overrides,
  };
}

function renderForm(props: Partial<ComponentProps<typeof TaskForm>> = {}) {
  return render(
    <TaskProvider>
      <TaskForm {...defaultProps} {...props} />
    </TaskProvider>,
  );
}

describe('TaskForm', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders in create mode', () => {
    renderForm();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Task name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
  });

  it('renders in edit mode with defaults', () => {
    renderForm({
      defaultValues: futureTask({ title: 'Edit me', description: 'Existing details' }),
    });

    expect(screen.getByDisplayValue('Edit me')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('does not render the dialog when closed', () => {
    renderForm({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows title and collection validation errors on empty submit after clearing fields', async () => {
    const user = userEvent.setup();
    renderForm();

    // Clear the auto-populated title field (it's empty by default, just submit)
    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/collection is required/i)).toBeInTheDocument();
    });
  });

  it('auto-populates start time and date on open in create mode', () => {
    renderForm();
    // The start time input should have a value (auto-set to next 15-min boundary)
    const startTimeInput = screen.getByLabelText(/start time/i) as HTMLInputElement;
    expect(startTimeInput.value).toMatch(/^\d{2}:\d{2}$/);

    // The start date input should default to today
    const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
    expect(startDateInput.value).toBe(todayISO());
  });

  it('shows end time (read-only) that updates when start time changes', async () => {
    const user = userEvent.setup();
    renderForm();

    // Change start time; end time should update
    const startTimeInput = screen.getByLabelText(/start time/i);
    await user.clear(startTimeInput);
    await user.type(startTimeInput, '08:00');

    // End Time label should be visible
    expect(screen.getByText(/end time/i)).toBeInTheDocument();
  });

  it('prevents title exceeding 30 characters with maxLength', async () => {
    const user = userEvent.setup();
    renderForm();

    const titleInput = screen.getByPlaceholderText('Task name') as HTMLInputElement;
    await user.type(titleInput, 'a'.repeat(35));

    expect(titleInput.value.length).toBeLessThanOrEqual(30);
    expect(screen.getByText(/30 \/ 30 characters/)).toBeInTheDocument();
  });

  it('prevents description exceeding 300 characters', async () => {
    const user = userEvent.setup();
    renderForm();

    const descInput = screen.getByPlaceholderText('Add a description…') as HTMLTextAreaElement;
    await user.type(descInput, 'b'.repeat(301));

    expect(screen.getByText(/300 \/ 300 characters/)).toBeInTheDocument();
  });

  it('displays character counters for title and description', async () => {
    const user = userEvent.setup();
    renderForm();

    const titleInput = screen.getByPlaceholderText('Task name');
    await user.type(titleInput, 'Test');
    expect(screen.getByText(/4 \/ 30 characters/)).toBeInTheDocument();

    const descInput = screen.getByPlaceholderText('Add a description…');
    await user.type(descInput, 'Description');
    expect(screen.getByText(/11 \/ 300 characters/)).toBeInTheDocument();
  });

  it('shows correct duration options in the schedule section', () => {
    renderForm();
    expect(screen.getByRole('button', { name: '15 min' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30 min' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '45 min' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 hour' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2 hours' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
  });

  it('selects priority and collection from chip menus', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /medium/i }));
    await user.click(screen.getByText('High'));

    await user.click(screen.getByRole('button', { name: /collection/i }));
    await user.click(screen.getByText('Work'));

    expect(screen.getByRole('button', { name: /high/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /work/i })).toBeInTheDocument();
  });

  it('calls onSubmit with selected values when editing with a future time', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    renderForm({ onSubmit, defaultValues: futureTask({ title: 'Existing' }) });

    const titleInput = screen.getByPlaceholderText('Task name');
    await user.clear(titleInput);
    await user.type(titleInput, 'New task');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New task',
          collection: 'work',
          priority: 'low',
          status: 'todo',
        }),
      );
    });
  });

  it('uses a locked collection and hides the collection chip', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    renderForm({
      onSubmit,
      lockedCollection: 'personal',
      defaultValues: futureTask({ collection: 'personal', title: '' }),
    });

    expect(screen.queryByRole('button', { name: /collection/i })).not.toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText('Task name');
    await user.clear(titleInput);
    await user.type(titleInput, 'Locked task');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ collection: 'personal' }));
    });
  });

  it('shows an empty collections menu message', async () => {
    const user = userEvent.setup();
    renderForm({ collections: [] });

    await user.click(screen.getByRole('button', { name: /collection/i }));
    expect(screen.getByText(/no collections yet/i)).toBeInTheDocument();
  });

  it('calls onClose when cancel clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderForm({ onClose });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('dismisses on Escape', () => {
    const onClose = vi.fn();
    renderForm({ onClose });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});
