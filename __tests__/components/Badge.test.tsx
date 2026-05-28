import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';

describe('PriorityBadge', () => {
  it('renders low priority label', () => {
    render(<PriorityBadge priority="low" />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders medium priority label', () => {
    render(<PriorityBadge priority="medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders high priority label', () => {
    render(<PriorityBadge priority="high" />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<PriorityBadge priority="high" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('StatusBadge', () => {
  it('renders todo status label', () => {
    render(<StatusBadge status="todo" />);
    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('renders in-progress status label', () => {
    render(<StatusBadge status="in-progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders done status label', () => {
    render(<StatusBadge status="done" />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });
});
