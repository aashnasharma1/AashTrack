import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/task/EmptyState';

describe('EmptyState', () => {
  it('renders "no tasks" state when not filtered', () => {
    render(<EmptyState isFiltered={false} onClearFilters={vi.fn()} onCreateTask={vi.fn()} />);
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your first task/i })).toBeInTheDocument();
  });

  it('renders "no matches" state when filtered', () => {
    render(<EmptyState isFiltered={true} onClearFilters={vi.fn()} onCreateTask={vi.fn()} />);
    expect(screen.getByText('No matching tasks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('calls onCreateTask when CTA clicked (unfiltered state)', () => {
    const onCreateTask = vi.fn();
    render(<EmptyState isFiltered={false} onClearFilters={vi.fn()} onCreateTask={onCreateTask} />);
    fireEvent.click(screen.getByRole('button', { name: /create your first task/i }));
    expect(onCreateTask).toHaveBeenCalled();
  });

  it('calls onClearFilters when clear button clicked (filtered state)', () => {
    const onClearFilters = vi.fn();
    render(<EmptyState isFiltered={true} onClearFilters={onClearFilters} onCreateTask={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(onClearFilters).toHaveBeenCalled();
  });
});
