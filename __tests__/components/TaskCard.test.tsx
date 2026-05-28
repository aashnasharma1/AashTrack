import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/task/TaskCard';
import type { Task } from '@/types/task';

const mockTask: Task = {
  id: 'task_1',
  title: 'Fix login bug',
  description: 'Users cannot authenticate',
  priority: 'high',
  status: 'in-progress',
  collection: 'Work',
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
  it('renders title', () => {
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
  it('renders collection label', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });
  it('calls onEdit when edit clicked', () => {
    const onEdit = vi.fn();
    render(<TaskCard task={mockTask} onEdit={onEdit} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/edit task/i));
    expect(onEdit).toHaveBeenCalledWith(mockTask);
  });
  it('shows confirm hint on first delete click', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/delete task/i));
    expect(screen.getByText(/click delete again to confirm/i)).toBeInTheDocument();
  });
  it('calls onDelete on second delete click', () => {
    const onDelete = vi.fn();
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText(/delete task/i));
    fireEvent.click(screen.getByLabelText(/click again to confirm/i));
    expect(onDelete).toHaveBeenCalledWith(mockTask.id);
  });
  it('shows drag handle when drag enabled', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} isDragDisabled={false} />);
    expect(screen.getByLabelText(/drag to reorder/i)).toBeInTheDocument();
  });
  it('hides drag handle when disabled', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} isDragDisabled />);
    expect(screen.queryByLabelText(/drag to reorder/i)).not.toBeInTheDocument();
  });
  it('truncates long descriptions', () => {
    const task = { ...mockTask, description: 'a'.repeat(200) };
    render(<TaskCard task={task} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/show more/i)).toBeInTheDocument();
  });
});
