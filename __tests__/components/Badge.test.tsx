import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ClickableStatusBadge,
  PriorityBadge,
  PrioritySelector,
  StatusBadge,
} from '@/components/ui/Badge';
import { DEFAULT_STATUS_GROUPS } from '@/types/task';

describe('PriorityBadge', () => {
  it('renders low priority label', () => {
    render(<PriorityBadge priority="low" />);
    expect(screen.getByLabelText('Low priority')).toBeInTheDocument();
  });

  it('renders medium priority label', () => {
    render(<PriorityBadge priority="medium" />);
    expect(screen.getByLabelText('Medium priority')).toBeInTheDocument();
  });

  it('renders high priority label', () => {
    render(<PriorityBadge priority="high" />);
    expect(screen.getByLabelText('High priority')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<PriorityBadge priority="high" className="custom-class" />);
    expect(container.querySelector('[aria-label="High priority"]')).toHaveClass('custom-class');
  });
});

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

  it('falls back to the raw status when no group matches', () => {
    render(<StatusBadge status="blocked" groups={DEFAULT_STATUS_GROUPS} />);
    expect(screen.getByText('blocked')).toBeInTheDocument();
  });
});

describe('PrioritySelector', () => {
  it('opens the priority menu and selects another priority', () => {
    const onChange = vi.fn();
    render(<PrioritySelector priority="medium" onChange={onChange} />);

    fireEvent.click(screen.getByTitle('Priority: Medium'));
    fireEvent.click(screen.getByText('High'));

    expect(onChange).toHaveBeenCalledWith('high');
    expect(screen.queryByText('Low')).not.toBeInTheDocument();
  });

  it('closes when clicking outside', () => {
    render(
      <div>
        <PrioritySelector priority="low" onChange={vi.fn()} />
        <button type="button">Outside</button>
      </div>,
    );

    fireEvent.click(screen.getByTitle('Priority: Low'));
    expect(screen.getByText('Medium')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText('Outside'));
    expect(screen.queryByText('Medium')).not.toBeInTheDocument();
  });
});

describe('ClickableStatusBadge', () => {
  it('cycles to the next group', () => {
    const onCycle = vi.fn();
    render(<ClickableStatusBadge status="todo" groups={DEFAULT_STATUS_GROUPS} onCycle={onCycle} />);

    fireEvent.click(screen.getByRole('button', { name: /click to change to in progress/i }));
    expect(onCycle).toHaveBeenCalledWith('in-progress');
  });

  it('handles unknown statuses without crashing', () => {
    const onCycle = vi.fn();
    render(
      <ClickableStatusBadge status="blocked" groups={DEFAULT_STATUS_GROUPS} onCycle={onCycle} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /status: blocked/i }));
    expect(onCycle).toHaveBeenCalledWith('todo');
  });
});
