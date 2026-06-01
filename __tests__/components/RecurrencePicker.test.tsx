import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RecurrencePicker } from '@/components/task/RecurrencePicker';

describe('RecurrencePicker', () => {
  it('opens from the empty state and commits a selected frequency', () => {
    const onChange = vi.fn();
    render(<RecurrencePicker value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /no repeat/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Weekdays' }));

    expect(onChange).toHaveBeenCalledWith({
      frequency: 'weekdays',
      customDays: [1, 3, 5],
      occurrences: 7,
    });
  });

  it('hydrates from an existing recurrence and removes it', () => {
    const onChange = vi.fn();
    render(
      <RecurrencePicker
        value={{ frequency: 'weekly', customDays: [2], occurrences: 3 }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('button', { name: /weekly · 3×/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /weekly · 3×/i }));
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.queryByText('Frequency')).not.toBeInTheDocument();
  });

  it('toggles custom days and keeps them sorted', () => {
    const onChange = vi.fn();
    render(
      <RecurrencePicker
        value={{ frequency: 'custom', customDays: [1, 3, 5], occurrences: 7 }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /custom · 7×/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Mo' }));
    expect(onChange).toHaveBeenCalledWith({
      frequency: 'custom',
      customDays: [3, 5],
      occurrences: 7,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Su' }));
    expect(onChange).toHaveBeenCalledWith({
      frequency: 'custom',
      customDays: [0, 3, 5],
      occurrences: 7,
    });
  });

  it('commits valid occurrence changes and ignores invalid values', () => {
    const onChange = vi.fn();
    render(<RecurrencePicker value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /no repeat/i }));
    const input = screen.getByRole('spinbutton');

    fireEvent.change(input, { target: { value: '12' } });
    expect(onChange).toHaveBeenCalledWith({
      frequency: 'daily',
      customDays: [1, 3, 5],
      occurrences: 12,
    });

    onChange.mockClear();
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.change(input, { target: { value: '366' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes with Done and outside clicks', () => {
    render(
      <div>
        <RecurrencePicker value={null} onChange={vi.fn()} />
        <button type="button">Outside</button>
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: /no repeat/i }));
    expect(screen.getByText('Frequency')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(screen.queryByText('Frequency')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /no repeat/i }));
    expect(screen.getByText('Frequency')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText('Outside'));
    expect(screen.queryByText('Frequency')).not.toBeInTheDocument();
  });
});
