import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { TaskProvider } from '@/context/TaskContext';
import { TaskCard } from '@/components/task/TaskCard';
import type { Task } from '@/types/task';

const wrapper = ({ children }: { children: ReactNode }) => <TaskProvider>{children}</TaskProvider>;

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
    render(<TaskCard task={mockTask} onDelete={vi.fn()} />, { wrapper });
    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
  });

  it('renders high priority aria-label', () => {
    render(<TaskCard task={mockTask} onDelete={vi.fn()} onUpdate={vi.fn()} />, { wrapper });
    expect(screen.getByLabelText(/high priority/i)).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<TaskCard task={mockTask} onDelete={vi.fn()} />, { wrapper });
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders collection name when collections provided', () => {
    const collections = [
      { id: 'c1', name: 'Work', slug: 'work', createdAt: new Date().toISOString() },
    ];
    const task = { ...mockTask, collection: 'work' };
    render(<TaskCard task={task} collections={collections} onDelete={vi.fn()} />, { wrapper });
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('shows confirm hint on first delete click', () => {
    render(<TaskCard task={mockTask} onDelete={vi.fn()} />, { wrapper });
    fireEvent.click(screen.getByLabelText(/delete task/i));
    expect(screen.getByText(/click delete again to confirm/i)).toBeInTheDocument();
  });

  it('calls onDelete on second delete click', () => {
    const onDelete = vi.fn();
    render(<TaskCard task={mockTask} onDelete={onDelete} />, { wrapper });
    fireEvent.click(screen.getByLabelText(/delete task/i));
    fireEvent.click(screen.getByLabelText(/click again to confirm/i));
    expect(onDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it('shows drag handle when drag enabled', () => {
    render(<TaskCard task={mockTask} onDelete={vi.fn()} isDragDisabled={false} />, { wrapper });
    expect(screen.getByLabelText(/drag to reorder/i)).toBeInTheDocument();
  });

  it('hides drag handle when disabled', () => {
    render(<TaskCard task={mockTask} onDelete={vi.fn()} isDragDisabled />, { wrapper });
    expect(screen.queryByLabelText(/drag to reorder/i)).not.toBeInTheDocument();
  });

  it('truncates long descriptions and shows expand button', () => {
    const task = { ...mockTask, description: 'a'.repeat(200) };
    render(<TaskCard task={task} onDelete={vi.fn()} />, { wrapper });
    expect(screen.getByText(/show more/i)).toBeInTheDocument();
  });
});
