import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '@/components/task/TaskForm';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  collections: ['Work', 'Personal'],
};

describe('TaskForm', () => {
  it('renders in create mode', () => {
    render(<TaskForm {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });
  it('renders in edit mode with defaults', () => {
    const task = {
      id: '1',
      title: 'Edit me',
      description: '',
      priority: 'high' as const,
      status: 'done' as const,
      collection: 'Work',
      createdAt: new Date().toISOString(),
      order: 0,
    };
    render(<TaskForm {...defaultProps} defaultValues={task} />);
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Edit me')).toBeInTheDocument();
  });
  it('does not render when closed', () => {
    render(<TaskForm {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
  });
  it('shows validation error for empty collection', async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    await user.type(screen.getByLabelText(/title/i), 'My task');
    await user.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });
  it('calls onSubmit with correct values', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/title/i), 'New task');
    await user.type(screen.getByLabelText(/collection/i), 'Work');
    await user.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New task', collection: 'Work' }),
      );
    });
  });
  it('calls onClose when cancel clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
  it('dismisses on Escape', () => {
    const onClose = vi.fn();
    render(<TaskForm {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
  it('shows character count for title', () => {
    render(<TaskForm {...defaultProps} />);
    expect(screen.getByText(/\/100/)).toBeInTheDocument();
  });
});
