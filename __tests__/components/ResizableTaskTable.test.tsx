import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ResizableTaskTable } from '@/components/task/ResizableTaskTable';

describe('ResizableTaskTable', () => {
  it('renders task columns with collection and sort state', () => {
    render(
      <ResizableTaskTable
        ariaLabel="Tasks"
        showCollection
        sort={{ sortBy: 'priority', sortOrder: 'asc' }}
      >
        <tr>
          <td>1</td>
        </tr>
      </ResizableTaskTable>,
    );

    expect(screen.getByRole('table', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /priority/i })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(screen.getByRole('columnheader', { name: /collection/i })).toBeInTheDocument();
  });

  it('hides the collection column when scoped and exposes resize handles', () => {
    render(
      <ResizableTaskTable ariaLabel="Scoped tasks" showCollection={false}>
        <tr>
          <td>1</td>
        </tr>
      </ResizableTaskTable>,
    );

    expect(screen.queryByRole('columnheader', { name: /collection/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resize name column/i })).toBeInTheDocument();
  });

  it('resizes a column while respecting minimum width', () => {
    const { container } = render(
      <ResizableTaskTable ariaLabel="Tasks">
        <tr>
          <td>1</td>
        </tr>
      </ResizableTaskTable>,
    );

    const nameCol = container.querySelector('col:nth-child(2)') as HTMLTableColElement;
    expect(nameCol.style.width).toBe('220px');

    fireEvent.mouseDown(screen.getByRole('button', { name: /resize name column/i }), {
      clientX: 200,
    });
    fireEvent.mouseMove(document, { clientX: 260 });
    expect(nameCol.style.width).toBe('280px');

    fireEvent.mouseMove(document, { clientX: 0 });
    expect(nameCol.style.width).toBe('220px');

    fireEvent.mouseUp(document);
    fireEvent.mouseMove(document, { clientX: 320 });
    expect(nameCol.style.width).toBe('220px');
  });
});
