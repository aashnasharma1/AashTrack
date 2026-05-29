import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { DEFAULT_STATUS_GROUPS } from '@/types/task';

// PriorityBadge is now a flag icon — accessible via aria-label, not visible text
describe('PriorityBadge', () => {
  it('renders low priority with aria-label', () => {
    render(<PriorityBadge priority="low" />);
    expect(screen.getByLabelText(/low priority/i)).toBeInTheDocument();
  });

  it('renders medium priority with aria-label', () => {
    render(<PriorityBadge priority="medium" />);
    expect(screen.getByLabelText(/medium priority/i)).toBeInTheDocument();
  });

  it('renders high priority with aria-label', () => {
    render(<PriorityBadge priority="high" />);
    expect(screen.getByLabelText(/high priority/i)).toBeInTheDocument();
  });

  it('applies custom className to the svg icon', () => {
    const { container } = render(<PriorityBadge priority="high" className="custom-class" />);
    expect(container.querySelector('svg')).toHaveClass('custom-class');
  });
});

// StatusBadge requires a groups prop and renders the matching group label
describe('StatusBadge', () => {
  it('renders todo status label', () => {
    render(<StatusBadge status="todo" groups={DEFAULT_STATUS_GROUPS} />);
    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('renders in-progress status label', () => {
    render(<StatusBadge status="in-progress" groups={DEFAULT_STATUS_GROUPS} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders done status label', () => {
    render(<StatusBadge status="done" groups={DEFAULT_STATUS_GROUPS} />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('falls back to raw status id when group not found', () => {
    render(<StatusBadge status="unknown" groups={DEFAULT_STATUS_GROUPS} />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });
});
