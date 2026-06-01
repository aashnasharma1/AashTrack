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
    });
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

  it('calls onSubmit with selected values', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });

    await user.type(screen.getByPlaceholderText('Task name'), 'New task');
    await user.click(screen.getByRole('button', { name: /collection/i }));
    await user.click(screen.getByText('Work'));
    await user.click(screen.getByRole('button', { name: /create task/i }));

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
    renderForm({ onSubmit, lockedCollection: 'personal' });

    expect(screen.queryByRole('button', { name: /collection/i })).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Task name'), 'Locked task');
    await user.click(screen.getByRole('button', { name: /create task/i }));

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
