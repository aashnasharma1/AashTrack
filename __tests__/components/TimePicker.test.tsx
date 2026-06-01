import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeRangePicker } from '@/components/ui/TimePicker';

describe('TimeRangePicker', () => {
  const isoForLocalDate = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a trigger button and opens the picker', () => {
    const onChange = vi.fn();
    render(<TimeRangePicker onChange={onChange} />);

    // Trigger button shows "Duration" when no time is set
    const trigger = screen.getByRole('button', { name: /duration/i });
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);

    // Popover opens with duration pills
    expect(screen.getByText('5 min')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('selects a duration pill in inline mode and calls onChange', () => {
    const onChange = vi.fn();
    // Use a past date so minFloor = 0 (no time clamping)
    render(<TimeRangePicker startTime="09:00" startDate="2020-01-01" onChange={onChange} inline />);

    fireEvent.click(screen.getByText('30 min'));
    expect(onChange).toHaveBeenCalled();
    const args = onChange.mock.lastCall as [string, string, string, string | undefined];
    expect(args[0]).toBe('09:00');
    expect(args[1]).toBe('09:30');
  });

  it('shows duration options including Custom', () => {
    render(<TimeRangePicker startTime="09:00" onChange={vi.fn()} inline />);

    expect(screen.getByText('5 min')).toBeInTheDocument();
    expect(screen.getByText('1 hr')).toBeInTheDocument();
    expect(screen.getByText('4 hr')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('clears time in inline mode', () => {
    const onChange = vi.fn();
    render(<TimeRangePicker startTime="09:00" endTime="10:00" onChange={onChange} inline />);

    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));
    expect(onChange).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
  });

  it('closes the popover when Done is clicked', () => {
    render(<TimeRangePicker onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /duration/i }));
    expect(screen.getByText('Done')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Done'));
    expect(screen.queryByText('Done')).not.toBeInTheDocument();
  });

  it('clears time in popover mode', () => {
    const onChange = vi.fn();
    render(<TimeRangePicker startTime="09:00" endTime="10:00" onChange={onChange} />);

    // Open popover
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Clear')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear'));
    expect(onChange).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
  });

  it('shows date picker in inline mode when startDate is provided', () => {
    render(
      <TimeRangePicker
        startTime="09:00"
        startDate={isoForLocalDate(2026, 4, 15)}
        onChange={vi.fn()}
        inline
      />,
    );

    // Should show a date button for the start date
    expect(screen.getByRole('button', { name: /may \d+, 2026/i })).toBeInTheDocument();
  });

  it('closes when Done is clicked in popover mode', () => {
    render(<TimeRangePicker onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /duration/i }));
    expect(screen.getByText('Done')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Done'));
    expect(screen.queryByText('Done')).not.toBeInTheDocument();
  });
});
