import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '@/components/task/TaskForm';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
};

describe('TaskForm', () => {
  it('renders the form in create mode', () => {
    render(<TaskForm {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('renders the form in edit mode', () => {
    const task = {
      id: '1',
      title: 'Existing task',
      description: 'desc',
      priority: 'high' as const,
      status: 'done' as const,
      createdAt: new Date().toISOString(),
      order: 0,
    };
    render(<TaskForm {...defaultProps} defaultValues={task} />);
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing task')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<TaskForm {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows validation error for empty title on submit', async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form values on valid submit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'My new task');
    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'My new task' }));
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when pressing Escape', async () => {
    const onClose = vi.fn();
    render(<TaskForm {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows character count for title', () => {
    render(<TaskForm {...defaultProps} />);
    expect(screen.getByText(/\/100/)).toBeInTheDocument();
  });

  it('shows character count for description', () => {
    render(<TaskForm {...defaultProps} />);
    expect(screen.getByText(/\/500/)).toBeInTheDocument();
  });
});
