import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityRecord } from '@shared/ipc/activity.js';
import { ActivityPanel } from '@/features/activity/ActivityPanel.js';
import { ActivityRow } from '@/features/activity/ActivityRow.js';
import { ActivityToolbar } from '@/features/activity/ActivityToolbar.js';
import { filterActivity, formatOffset, newestFirst } from '@/features/activity/useActivityFilter.js';
import { useStore } from '@/store/index.js';

// The detail pane is a Monaco viewer, and jsdom has no layout for it to measure.
// Only its presence matters here, so the editor is reduced to inert refs.
vi.mock('@/shared/monaco/useMonacoEditor.js', () => ({
  modelFor: () => ({ getValue: () => '', setValue: () => undefined }),
  useMonacoEditor: () => ({ containerRef: { current: null }, editorRef: { current: null } }),
}));

const record = (over: Partial<ActivityRecord>): ActivityRecord => ({
  id: 'c1:1',
  connectionId: 'c1',
  sequence: 1,
  kind: 'incoming',
  at: 1000,
  label: 'DeviceLogin',
  body: '{"ok":true}',
  bytes: 11,
  ...over,
});

describe('filterActivity', () => {
  it('matches the label or the body', () => {
    const records = [
      record({ id: 'a', label: 'DeviceLogin', body: '{}' }),
      record({ id: 'b', label: 'PcStatus', body: '{"device":1}' }),
    ];
    expect(filterActivity(records, 'device').map((item) => item.id)).toEqual(['a', 'b']);
    expect(filterActivity(records, 'pcstatus').map((item) => item.id)).toEqual(['b']);
    expect(filterActivity(records, '')).toHaveLength(2);
  });
});

describe('newestFirst', () => {
  it('puts the last record at the top without touching the array it was given', () => {
    const records = [record({ id: 'a' }), record({ id: 'b' }), record({ id: 'c' })];

    expect(newestFirst(records).map((item) => item.id)).toEqual(['c', 'b', 'a']);
    // The store hands out its own array: reversing it in place would reorder the
    // buffer every other reader shares.
    expect(records.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('formatOffset', () => {
  it('renders minutes, seconds and tenths since the origin', () => {
    expect(formatOffset(1000, 1000)).toBe('00:00.0');
    expect(formatOffset(64500, 1000)).toBe('01:03.5');
  });
});

describe('ActivityRow', () => {
  it('shows the direction, label, frame and offset', () => {
    render(
      <ActivityRow
        record={record({
          kind: 'outgoing',
          label: 'DeviceLogin',
          body: '{\n  "event": "DeviceLogin"\n}',
          at: 3800,
        })}
        origin={1000}
        selected={false}
        onSelect={() => undefined}
      />,
    );
    expect(screen.getByText('DeviceLogin')).toBeTruthy();
    // Flattened to one line: the row is 26px tall and the detail pane is where
    // the frame gets to breathe.
    expect(screen.getByText('{ "event": "DeviceLogin" }')).toBeTruthy();
    expect(screen.getByText('00:02.8')).toBeTruthy();
    expect(screen.getByLabelText('saliente')).toBeTruthy();
  });

  /**
   * A frame that is not an `{event, data}` envelope gets a truncated copy of
   * itself as a label, and a row that prints that twice is noise.
   */
  it('drops the frame when the label was cut from it', () => {
    render(
      <ActivityRow
        record={record({ label: 'echo:{ "ok": true…', body: 'echo:{ "ok": true }' })}
        origin={1000}
        selected={false}
        onSelect={() => undefined}
      />,
    );
    expect(screen.queryByText('echo:{ "ok": true }')).toBeNull();
    expect(screen.getByText('echo:{ "ok": true…')).toBeTruthy();
  });

  it('keeps a status detail beside its label', () => {
    render(
      <ActivityRow
        record={record({ kind: 'status', label: 'Cerrado (1000)', body: 'going away' })}
        origin={1000}
        selected={false}
        onSelect={() => undefined}
      />,
    );
    expect(screen.getByText('Cerrado (1000)')).toBeTruthy();
    expect(screen.getByText('going away')).toBeTruthy();
  });
});

describe('ActivityToolbar', () => {
  it('warns only when the peer closed the socket', () => {
    const { rerender } = render(
      <ActivityToolbar
        query=""
        dropped={false}
        onQueryChange={() => undefined}
        onClear={() => undefined}
      />,
    );
    expect(screen.queryByText('Desconectado')).toBeNull();

    rerender(
      <ActivityToolbar
        query=""
        dropped
        onQueryChange={() => undefined}
        onClear={() => undefined}
      />,
    );
    expect(screen.getByText('Desconectado')).toBeTruthy();
  });
});

describe('ActivityPanel', () => {
  beforeEach(() => {
    useStore.getState().reset();
    useStore.getState().appendActivity([record({ id: 'c1:1' })]);
  });

  it('shows the detail pane only while a line is marked', () => {
    render(<ActivityPanel connectionId="c1" />);
    expect(screen.queryByTestId('activity-detail')).toBeNull();

    act(() => {
      useStore.getState().setSelectedActivity('c1', 'c1:1');
    });
    expect(screen.getByTestId('activity-detail')).toBeTruthy();

    act(() => {
      useStore.getState().setSelectedActivity('c1', null);
    });
    expect(screen.queryByTestId('activity-detail')).toBeNull();
  });

  it('closes the detail pane from its own button', () => {
    render(<ActivityPanel connectionId="c1" />);
    act(() => {
      useStore.getState().setSelectedActivity('c1', 'c1:1');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar detalle' }));

    expect(screen.queryByTestId('activity-detail')).toBeNull();
    expect(useStore.getState().selectedActivityByConnection.c1 ?? null).toBeNull();
  });

  it('flags a dropped connection next to the log', () => {
    useStore.getState().setConnectionState('c1', 'dropped');
    render(<ActivityPanel connectionId="c1" />);

    expect(screen.getByText('Desconectado')).toBeTruthy();
  });
});
