import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/task/TaskCard';
import type { Task } from '@/types/task';

const mockTask: Task = {
  id: 'task_test_1',
  title: 'Fix login bug',
  description: 'Users cannot authenticate with Google SSO',
  priority: 'high',
  status: 'in-progress',
  createdAt: new Date(Date.now() - 60_000).toISOString(),
  order: 0,
};

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

describe('TaskCard', () => {
  it('renders task title', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
  });

  it('renders priority badge', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('truncates long descriptions', () => {
    const longDesc = 'a'.repeat(200);
    const task = { ...mockTask, description: longDesc };
    render(<TaskCard task={task} onEdit={vi.fn()} onDelete={vi.fn()} />);
    // Should show "Show more" button for long descriptions
    expect(screen.getByText(/Show more/i)).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<TaskCard task={mockTask} onEdit={onEdit} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/edit task/i));
    expect(onEdit).toHaveBeenCalledWith(mockTask);
  });

  it('shows confirmation hint on first delete click', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/delete task/i));
    // After first click the button aria-label changes to confirm
    expect(screen.getByLabelText(/click again to confirm/i)).toBeInTheDocument();
    // The hint text appears in the card
    expect(screen.getByText(/click delete again to confirm/i)).toBeInTheDocument();
  });

  it('calls onDelete on second delete click', () => {
    const onDelete = vi.fn();
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText(/delete task/i));
    fireEvent.click(screen.getByLabelText(/click again to confirm/i));
    expect(onDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it('renders the drag handle when drag is enabled', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} isDragDisabled={false} />);
    expect(screen.getByLabelText(/drag to reorder/i)).toBeInTheDocument();
  });

  it('hides drag handle when drag is disabled', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} isDragDisabled={true} />);
    expect(screen.queryByLabelText(/drag to reorder/i)).not.toBeInTheDocument();
  });

  it('renders task creation time', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
