import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from '@/components/ui/DatePicker';

describe('DatePicker', () => {
  const isoForLocalDate = (year: number, month: number, day: number) =>
    new Date(year, month, day).toISOString().split('T')[0];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens the calendar and selects a date', () => {
    const onChange = vi.fn();
    render(<DatePicker onChange={onChange} placeholder="Pick date" />);

    fireEvent.click(screen.getByRole('button', { name: /pick date/i }));
    expect(screen.getByText('May 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '15' }));

    expect(onChange).toHaveBeenCalledWith(isoForLocalDate(2026, 4, 15));
    expect(screen.queryByText('May 2026')).not.toBeInTheDocument();
  });

  it('formats and clears an existing value', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2026-05-20" onChange={onChange} />);

    expect(screen.getByText('May 20, 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /may 20, 2026/i }));
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('navigates across year boundaries', () => {
    const onChange = vi.fn();
    render(<DatePicker onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /select date/i }));
    const buttons = document.body.querySelectorAll('button');
    fireEvent.click(buttons[1]);
    expect(screen.getByText('Apr 2026')).toBeInTheDocument();

    for (let i = 0; i < 9; i += 1) fireEvent.click(buttons[2]);
    expect(screen.getByText('Jan 2027')).toBeInTheDocument();
  });

  it('closes when clicking outside', () => {
    render(
      <div>
        <DatePicker onChange={vi.fn()} />
        <button type="button">Outside</button>
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: /select date/i }));
    expect(screen.getByText('May 2026')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText('Outside'));
    expect(screen.queryByText('May 2026')).not.toBeInTheDocument();
  });
});
