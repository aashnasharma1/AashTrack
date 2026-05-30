import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeRangePicker } from '@/components/ui/TimePicker';

describe('TimeRangePicker', () => {
  const isoForLocalDate = (year: number, month: number, day: number) =>
    new Date(year, month, day).toISOString().split('T')[0];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders an empty trigger and opens the picker', () => {
    const onChange = vi.fn();
    render(<TimeRangePicker onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /add schedule/i }));

    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });

  it('applies preset times for start and end tabs', () => {
    const onChange = vi.fn();
    render(<TimeRangePicker startTime="08:00" endTime="17:00" onChange={onChange} inline />);

    fireEvent.click(screen.getByText('Midday'));
    expect(onChange).toHaveBeenLastCalledWith('12:00', '17:00', undefined, undefined);

    fireEvent.click(screen.getByRole('button', { name: /end .*17:00/i }));
    fireEvent.click(screen.getByText('Evening'));
    expect(onChange).toHaveBeenLastCalledWith('12:00', '18:00', undefined, undefined);
  });

  it('increments and decrements hours and minutes', () => {
    const onChange = vi.fn();
    const { container } = render(
      <TimeRangePicker startTime="09:00" endTime="10:00" onChange={onChange} inline />,
    );

    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[7]);
    expect(onChange).toHaveBeenLastCalledWith('10:00', '10:00', undefined, undefined);

    fireEvent.click(buttons[9]);
    expect(onChange).toHaveBeenLastCalledWith('10:15', '10:00', undefined, undefined);

    fireEvent.click(buttons[10]);
    expect(onChange).toHaveBeenLastCalledWith('10:00', '10:00', undefined, undefined);
  });

  it('sets and clears dates from the active tab', () => {
    const onChange = vi.fn();
    render(
      <TimeRangePicker
        startTime="09:00"
        endTime="10:00"
        startDate="2026-05-15"
        onChange={onChange}
        inline
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /may \d+, 2026/i }));
    fireEvent.click(screen.getByRole('button', { name: '20' }));
    expect(onChange).toHaveBeenLastCalledWith(
      '09:00',
      '10:00',
      isoForLocalDate(2026, 4, 20),
      undefined,
    );

    fireEvent.click(screen.getByRole('button', { name: /may \d+, 2026/i }));
    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));
    expect(onChange).toHaveBeenLastCalledWith('09:00', '10:00', undefined, undefined);
  });

  it('shows date prefix, next-day marker, done, and clear behavior in popover mode', () => {
    const onChange = vi.fn();
    render(
      <TimeRangePicker
        startTime="22:00"
        endTime="06:00"
        startDate="2026-05-15"
        endDate="2026-05-16"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /schedule/i }));
    expect(screen.getByText('May 15')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Done'));
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /schedule/i }));
    fireEvent.click(screen.getByText('Clear all'));
    expect(onChange).toHaveBeenLastCalledWith(undefined, undefined, undefined, undefined);
  });

  it('closes when scrolling outside the popover', () => {
    render(<TimeRangePicker onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /add schedule/i }));
    expect(screen.getByText('Night')).toBeInTheDocument();

    fireEvent.scroll(window);
    expect(screen.queryByText('Night')).not.toBeInTheDocument();
  });
});
