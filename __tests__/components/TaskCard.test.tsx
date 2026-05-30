import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { TaskCard } from '@/components/task/TaskCard';
import { TaskProvider } from '@/context/TaskContext';
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
  const renderCard = (props: Partial<ComponentProps<typeof TaskCard>> = {}) =>
    render(
      <TaskProvider>
        <TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} {...props} />
      </TaskProvider>,
    );

  it('renders title', () => {
    renderCard();
    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
  });

  it('renders priority badge', () => {
    renderCard({ onUpdate: vi.fn() });
    expect(screen.getByLabelText('High priority')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    renderCard();
    expect(screen.getByText('in-progress')).toBeInTheDocument();
  });

  it('renders collection label', () => {
    renderCard({
      collections: [{ id: '1', name: 'Work', slug: 'Work', createdAt: new Date().toISOString() }],
    });
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('calls onEdit when edit clicked', () => {
    const onEdit = vi.fn();
    renderCard({ onEdit });
    fireEvent.click(screen.getByText('Fix login bug'));
    expect(onEdit).toHaveBeenCalledWith(mockTask);
  });

  it('edits title inline when update handler is provided', () => {
    const onUpdate = vi.fn();
    renderCard({ onUpdate });

    fireEvent.click(screen.getByText('Fix login bug'));
    const input = screen.getByDisplayValue('Fix login bug');
    fireEvent.change(input, { target: { value: 'Fix signup bug' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onUpdate).toHaveBeenCalledWith(mockTask.id, { title: 'Fix signup bug' });
  });

  it('shows confirm hint on first delete click', () => {
    renderCard();
    fireEvent.click(screen.getByLabelText(/delete task/i));
    expect(screen.getByText(/click delete again to confirm/i)).toBeInTheDocument();
  });

  it('calls onDelete on second delete click', () => {
    const onDelete = vi.fn();
    renderCard({ onDelete });
    fireEvent.click(screen.getByLabelText(/delete task/i));
    fireEvent.click(screen.getByLabelText(/click again to confirm/i));
    expect(onDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it('shows drag handle when drag enabled', () => {
    renderCard({ isDragDisabled: false });
    expect(screen.getByLabelText(/drag to reorder/i)).toBeInTheDocument();
  });

  it('hides drag handle when disabled', () => {
    renderCard({ isDragDisabled: true });
    expect(screen.queryByLabelText(/drag to reorder/i)).not.toBeInTheDocument();
  });

  it('truncates long descriptions', () => {
    const task = { ...mockTask, description: 'a'.repeat(200) };
    renderCard({ task });
    expect(screen.getByText(/show more/i)).toBeInTheDocument();
  });

  it('expands and collapses long descriptions', () => {
    const task = { ...mockTask, description: 'a'.repeat(200) };
    renderCard({ task });

    fireEvent.click(screen.getByText(/show more/i));
    expect(screen.getByText(/show less/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/show less/i));
    expect(screen.getByText(/show more/i)).toBeInTheDocument();
  });

  it('cycles status with the clickable status badge', () => {
    const onStatusChange = vi.fn();
    renderCard({ onStatusChange });

    fireEvent.click(screen.getByRole('button', { name: /status: in progress/i }));
    expect(onStatusChange).toHaveBeenCalledWith(mockTask.id, 'done');
  });
});
