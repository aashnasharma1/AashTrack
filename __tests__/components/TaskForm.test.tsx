import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { TaskForm } from '@/components/task/TaskForm';
import { TaskProvider } from '@/context/TaskContext';
import type { Task } from '@/types/task';

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
    const task: Task = {
      id: '1',
      title: 'Edit me',
      description: 'Existing details',
      priority: 'high',
      status: 'done',
      collection: 'work',
      createdAt: new Date().toISOString(),
      order: 0,
      startTime: '09:00',
      endTime: '10:00',
    };

    renderForm({ defaultValues: task });

    expect(screen.getByDisplayValue('Edit me')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('does not render the dialog when closed', () => {
    renderForm({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/collection is required/i)).toBeInTheDocument();
      expect(screen.getByText(/start time is required/i)).toBeInTheDocument();
    });
  });

  it('prevents title exceeding 30 characters with maxLength', async () => {
    const user = userEvent.setup();
    renderForm();

    const titleInput = screen.getByPlaceholderText('Task name') as HTMLInputElement;
    await user.type(titleInput, 'a'.repeat(35));

    // maxLength attribute prevents typing beyond 30
    expect(titleInput.value.length).toBeLessThanOrEqual(30);
    expect(screen.getByText(/30 \/ 30 characters/)).toBeInTheDocument();
  });

  it('prevents description exceeding 300 characters', async () => {
    const user = userEvent.setup();
    renderForm();

    const descInput = screen.getByPlaceholderText('Add a description…') as HTMLTextAreaElement;
    await user.type(descInput, 'b'.repeat(301));

    // Counter should show 300 / 300 (maxLength prevents typing 301st char)
    expect(screen.getByText(/300 \/ 300 characters/)).toBeInTheDocument();
  });

  it('displays character counters for title and description', async () => {
    const user = userEvent.setup();
    renderForm();

    const titleInput = screen.getByPlaceholderText('Task name');
    await user.type(titleInput, 'Test');

    // Check for counter pattern "4 / 30 characters"
    expect(screen.getByText(/4 \/ 30 characters/)).toBeInTheDocument();

    const descInput = screen.getByPlaceholderText('Add a description…');
    await user.type(descInput, 'Description');

    // Check for counter pattern "11 / 300 characters"
    expect(screen.getByText(/11 \/ 300 characters/)).toBeInTheDocument();
  });

  it('selects priority and collection from chip menus', async () => {
    const user = userEvent.setup();
    renderForm();

    // Priority chip — default is 'low'
    await user.click(screen.getByRole('button', { name: /low/i }));
    await user.click(screen.getByText('High'));

    // Collection chip
    await user.click(screen.getByRole('button', { name: /collection/i }));
    await user.click(screen.getByText('Work'));

    expect(screen.getByRole('button', { name: /high/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /work/i })).toBeInTheDocument();
  });

  it('calls onSubmit with selected values when time is set', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const task: Task = {
      id: '1',
      title: 'Existing',
      description: '',
      priority: 'low',
      status: 'todo',
      collection: 'work',
      createdAt: new Date().toISOString(),
      order: 0,
      startTime: '09:00',
      endTime: '10:00',
      startDate: new Date().toISOString().split('T')[0],
    };

    renderForm({ onSubmit, defaultValues: task });

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
    const task: Task = {
      id: '1',
      title: '',
      description: '',
      priority: 'low',
      status: 'todo',
      collection: 'personal',
      createdAt: new Date().toISOString(),
      order: 0,
      startTime: '09:00',
      endTime: '10:00',
      startDate: new Date().toISOString().split('T')[0],
    };

    renderForm({ onSubmit, lockedCollection: 'personal', defaultValues: task });

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
