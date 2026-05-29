import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { TaskProvider } from '@/context/TaskContext';
import { TaskForm } from '@/components/task/TaskForm';

const wrapper = ({ children }: { children: ReactNode }) => <TaskProvider>{children}</TaskProvider>;

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  collections: [
    { id: '1', name: 'Work', slug: 'work', createdAt: new Date().toISOString() },
    { id: '2', name: 'Personal', slug: 'personal', createdAt: new Date().toISOString() },
  ],
};

describe('TaskForm', () => {
  it('renders the dialog when open', () => {
    render(<TaskForm {...defaultProps} />, { wrapper });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders task name placeholder in create mode', () => {
    render(<TaskForm {...defaultProps} />, { wrapper });
    expect(screen.getByPlaceholderText('Task name')).toBeInTheDocument();
  });

  it('renders with existing title in edit mode', () => {
    const task = {
      id: '1',
      title: 'Edit me',
      description: '',
      priority: 'high' as const,
      status: 'todo',
      collection: 'work',
      createdAt: new Date().toISOString(),
      order: 0,
    };
    render(<TaskForm {...defaultProps} defaultValues={task} />, { wrapper });
    expect(screen.getByDisplayValue('Edit me')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<TaskForm {...defaultProps} open={false} />, { wrapper });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows title validation error on empty submit', async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} lockedCollection="work" />, { wrapper });
    await user.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('calls onSubmit when title and collection are provided (locked collection)', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} onSubmit={onSubmit} lockedCollection="work" />, { wrapper });
    await user.type(screen.getByPlaceholderText('Task name'), 'New task');
    await user.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New task', collection: 'work' }),
      );
    });
  });

  it('calls onClose when cancel clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} onClose={onClose} />, { wrapper });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('dismisses on Escape', () => {
    const onClose = vi.fn();
    render(<TaskForm {...defaultProps} onClose={onClose} />, { wrapper });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
