import type { ComponentProps } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cloneWebSocketSettings } from '@shared/domain/connections/defaults.js';
import { createWorkspace } from '@shared/domain/factory.js';
import type { ActivityKind, WebSocketActivityRecord } from '@shared/ipc/activity.js';
import { ActivityDetail } from '@/features/activity/ActivityDetail.js';
import { ActivityPanel } from '@/features/activity/ActivityPanel.js';
import { ActivityRow } from '@/features/activity/ActivityRow.js';
import { EN } from '@lang/en/index.js';
import { rowText } from '@/features/activity/copy-text.js';
import { ActivityToolbar } from '@/features/activity/ActivityToolbar.js';
import { formatOffset, newestFirstMatching } from '@/features/activity/useActivityFilter.js';
import { useStore } from '@/store/index.js';

// The detail pane is a Monaco viewer, and jsdom has no layout for it to measure.
// Only its presence matters here, so the editor is reduced to inert refs.
vi.mock('@/shared/monaco/useMonacoEditor.js', () => ({
  modelFor: () => ({ getValue: () => '', setValue: () => undefined }),
  useMonacoEditor: () => ({ containerRef: { current: null }, editorRef: { current: null } }),
}));

const bridgeMock = vi.hoisted(() => ({
  activity: { export: vi.fn(() => Promise.resolve({ ok: true as const })) },
  clipboard: { writeText: vi.fn(() => Promise.resolve()) },
}));

vi.mock('@/ipc/bridge.js', () => ({ bridge: bridgeMock }));

const record = (over: Partial<WebSocketActivityRecord>): WebSocketActivityRecord => ({
  id: 'c1:1',
  connectionId: 'c1',
  transportKind: 'websocket',
  sequence: 1,
  kind: 'incoming',
  at: 1000,
  label: 'DeviceLogin',
  body: '{"ok":true}',
  encoding: 'text',
  bytes: 11,
  ...over,
});

describe('newestFirstMatching', () => {
  it('matches the label or the body, case insensitively', () => {
    const records = [
      record({ id: 'a', label: 'DeviceLogin', body: '{}' }),
      record({ id: 'b', label: 'PcStatus', body: '{"device":1}' }),
    ];
    expect(newestFirstMatching(records, 'device').map((item) => item.id)).toEqual(['b', 'a']);
    expect(newestFirstMatching(records, 'pcstatus').map((item) => item.id)).toEqual(['b']);
    expect(newestFirstMatching(records, '')).toHaveLength(2);
  });

  it('puts the last record at the top without touching the array it was given', () => {
    const records = [record({ id: 'a' }), record({ id: 'b' }), record({ id: 'c' })];

    expect(newestFirstMatching(records, '').map((item) => item.id)).toEqual(['c', 'b', 'a']);
    // The store hands out its own array: reversing it in place would reorder the
    // buffer every other reader shares.
    expect(records.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  // Both filters are answered in the same walk of the log: a hidden kind never
  // reaches the pattern, and a second array is never built to drop it.
  it('combines the query with the kinds that are hidden', () => {
    const records = [
      record({ id: 'a', kind: 'incoming', label: 'DeviceLogin', body: '{}' }),
      record({ id: 'b', kind: 'status', label: 'Connected', body: 'device' }),
      record({ id: 'c', kind: 'outgoing', label: 'DeviceLogin', body: '{}' }),
    ];

    expect(newestFirstMatching(records, '', { status: true }).map((item) => item.id)).toEqual([
      'c',
      'a',
    ]);
    expect(
      newestFirstMatching(records, 'device', { outgoing: true }).map((item) => item.id),
    ).toEqual(['b', 'a']);
    expect(newestFirstMatching(records, '', { incoming: true, outgoing: true, status: true })).toHaveLength(0);
  });

  // The needle is compiled into a pattern, so anything a user types has to be
  // taken literally rather than as syntax.
  it('treats regular expression syntax in the query as text', () => {
    const records = [record({ id: 'a', body: 'a+b' }), record({ id: 'b', body: 'aab' })];
    expect(newestFirstMatching(records, 'a+b').map((item) => item.id)).toEqual(['a']);
    expect(newestFirstMatching(records, '.*').map((item) => item.id)).toEqual([]);
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
        onCopy={() => undefined}
        onResend={() => undefined}
        canResend={false}
      />,
    );
    expect(screen.getByText('DeviceLogin')).toBeTruthy();
    // Flattened to one line: the row is 26px tall and the detail pane is where
    // the frame gets to breathe.
    expect(screen.getByText('{ "event": "DeviceLogin" }')).toBeTruthy();
    expect(screen.getByText('00:02.8')).toBeTruthy();
    expect(screen.getByLabelText('outgoing')).toBeTruthy();
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
        onCopy={() => undefined}
        onResend={() => undefined}
        canResend={false}
      />,
    );
    expect(screen.queryByText('echo:{ "ok": true }')).toBeNull();
    expect(screen.getByText('echo:{ "ok": true…')).toBeTruthy();
  });

  it('keeps a status detail beside its label', () => {
    render(
      <ActivityRow
        record={record({ kind: 'status', label: 'Closed (1000)', body: 'going away' })}
        origin={1000}
        selected={false}
        onSelect={() => undefined}
        onCopy={() => undefined}
        onResend={() => undefined}
        canResend={false}
      />,
    );
    expect(screen.getByText('Closed (1000)')).toBeTruthy();
    expect(screen.getByText('going away')).toBeTruthy();
  });

  /**
   * Base64 in the preview column is unreadable and, worse, looks like text that
   * arrived. Hex is what the detail pane will show, so the row previews the same
   * thing the frame is about to be opened as.
   */
  it('previews a binary frame in hex, not as base64', () => {
    render(
      <ActivityRow
        record={record({ label: 'Binary', encoding: 'base64', body: 'iVBORw==', bytes: 4 })}
        origin={1000}
        selected={false}
        onSelect={() => undefined}
        onCopy={() => undefined}
        onResend={() => undefined}
        canResend={false}
      />,
    );
    expect(screen.getByText('89 50 4e 47')).toBeTruthy();
    expect(screen.queryByText('iVBORw==')).toBeNull();
  });
});

describe('copying a frame', () => {
  it('writes the row as one line, with the offset and the direction', () => {
    expect(
      rowText(record({ kind: 'outgoing', label: 'DeviceLogin', body: '{\n  "a": 1\n}', at: 3800 }), 1000, EN.activity.kinds),
    ).toBe('00:02.8\tOutgoing\tDeviceLogin\t{ "a": 1 }');
  });

  it('offers both scopes and reports which one was picked', async () => {
    const user = userEvent.setup();
    const copied: string[] = [];
    const frame = record({ body: '{"ok":true}' });
    render(
      <ActivityRow
        record={frame}
        origin={1000}
        selected={false}
        onSelect={() => undefined}
        onCopy={(_record, scope) => copied.push(scope)}
        onResend={() => undefined}
        canResend
      />,
    );

    await user.pointer({ keys: '[MouseRight]', target: screen.getByRole('button') });
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Copy body',
      'Copy row',
      'Send to the composer',
    ]);

    await user.click(screen.getByRole('menuitem', { name: 'Copy body' }));
    expect(copied).toEqual(['body']);
  });

  // The row is a button and the log is walked with the keyboard: the shortcut
  // has to work where the focus already is, without opening the menu.
  it('copies the body with the keyboard from the focused row', () => {
    const copied: string[] = [];
    render(
      <ActivityRow
        record={record({})}
        origin={1000}
        selected={false}
        onSelect={() => undefined}
        onCopy={(_record, scope) => copied.push(scope)}
        onResend={() => undefined}
        canResend
      />,
    );

    fireEvent.keyDown(screen.getByRole('button'), { key: 'c', ctrlKey: true });
    expect(copied).toEqual(['body']);
  });

  it('copies the exact frame from the detail pane, not the pretty-printed one', () => {
    const copied: string[] = [];
    render(
      <ActivityDetail
        record={record({ body: '{"ok":true}' })}
        onClose={() => undefined}
        onCopy={() => copied.push('body')}
        onResend={() => undefined}
        canResend={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy the frame' }));
    expect(copied).toEqual(['body']);
  });
});

describe('the detail pane of a binary frame', () => {
  const props = (
    over: Partial<WebSocketActivityRecord>,
  ): ComponentProps<typeof ActivityDetail> => ({
    record: record(over),
    onClose: () => undefined,
    onCopy: () => undefined,
    onResend: () => undefined,
    canResend: false,
  });

  /** Text goes to Monaco; bytes have no text to colour, so they go to the dump. */
  it('reads a text frame in the editor and a binary one in the dump', () => {
    const { unmount } = render(<ActivityDetail {...props({ body: '{"ok":true}' })} />);
    expect(screen.queryByTestId('hex-view')).toBeNull();
    unmount();

    render(<ActivityDetail {...props({ encoding: 'base64', body: 'AAECAw==', bytes: 4 })} />);
    expect(screen.getByTestId('hex-view')).toBeTruthy();
  });

  /**
   * The dump is virtualized on its rows, not on the frame: a megabyte is sixty
   * five thousand lines, and the pane has to know how many there are without
   * laying a single one of them out.
   */
  it('counts the rows of the frame without drawing them', () => {
    const megabyte = 'A'.repeat(Math.ceil((1024 * 1024 * 4) / 3));
    render(
      <ActivityDetail {...props({ encoding: 'base64', body: megabyte, bytes: 1024 * 1024 })} />,
    );

    expect(screen.getByTestId('hex-view').getAttribute('data-rows')).toBe('65536');
  });

  /** A frame the sender said was binary but that is not base64 is still a frame. */
  it('says so instead of drawing an empty dump for an unreadable body', () => {
    render(<ActivityDetail {...props({ encoding: 'base64', body: 'not base64!', bytes: 4 })} />);

    expect(screen.getByText('This frame could not be read as binary.')).toBeTruthy();
  });
});

describe('resending a frame', () => {
  const workspaceWithEvent = (): void => {
    const workspace = createWorkspace('Demo');
    const [collection] = workspace.catalog.collections;
    workspace.catalog.items.push({
      id: 'e1',
      collectionId: collection?.id ?? '',
      name: 'Ping',
      payload: '{"a":1}',
      source: 'manual',
    });
    useStore.getState().setWorkspace(workspace);
    useStore.getState().setSelectedEvent('c1', 'e1');
  };

  const openDetail = (): void => {
    useStore.getState().appendActivity([record({ id: 'c1:1', body: '{"from":"server"}' })]);
    render(<ActivityPanel connectionId="c1" />);
    act(() => {
      useStore.getState().setSelectedActivity('c1', 'c1:1');
    });
  };

  beforeEach(() => {
    useStore.getState().reset();
  });

  it('loads the frame into the composer when no edit is at risk', () => {
    workspaceWithEvent();
    openDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Send to the composer' }));

    expect(useStore.getState().drafts['c1:e1']).toBe('{"from":"server"}');
  });

  // Overwriting an unsaved payload without asking is the one way this action
  // can destroy work the user cannot get back.
  it('asks before replacing a draft with unsaved changes', async () => {
    const user = userEvent.setup();
    workspaceWithEvent();
    useStore.getState().setDraft('c1', 'e1', '{"a":2}');
    openDetail();

    await user.click(screen.getByRole('button', { name: 'Send to the composer' }));
    expect(useStore.getState().drafts['c1:e1']).toBe('{"a":2}');

    await user.click(screen.getByRole('button', { name: 'Replace' }));
    expect(useStore.getState().drafts['c1:e1']).toBe('{"from":"server"}');
  });

  it('offers nothing to resend into while no event is open', () => {
    openDetail();

    expect(
      screen.getByRole('button', { name: 'Send to the composer' }).hasAttribute('disabled'),
    ).toBe(true);
  });
});

describe('exporting the session', () => {
  beforeEach(() => {
    useStore.getState().reset();
    bridgeMock.activity.export.mockClear();
  });

  // The values were substituted into the frames before they went on the wire, so
  // the log holds in plain text what the workspace file is never allowed to keep.
  it('hands the log over with the secrets that have to be hidden', () => {
    const workspace = createWorkspace('Demo');
    workspace.environments.push({
      id: 'env1',
      name: 'local',
      variables: [
        { name: 'token', value: 's3cr3t', secret: true },
        { name: 'host', value: '127.0.0.1', secret: false },
      ],
    });
    workspace.connections.push({
      id: 'c1',
      name: 'echo',
      environmentId: 'env1',
      transport: { kind: 'websocket', url: 'ws://x', settings: cloneWebSocketSettings() },
    });
    useStore.getState().setWorkspace(workspace);
    useStore.getState().appendActivity([record({ id: 'c1:1', body: 'auth=s3cr3t' })]);

    render(<ActivityPanel connectionId="c1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Export the activity' }));

    expect(bridgeMock.activity.export).toHaveBeenCalledWith({
      connectionName: 'echo',
      records: useStore.getState().activity.c1,
      secrets: [{ name: 'token', value: 's3cr3t' }],
    });
  });

  it('offers nothing to export while the log is empty', () => {
    render(<ActivityPanel connectionId="c1" />);

    expect(
      screen.getByRole('button', { name: 'Export the activity' }).hasAttribute('disabled'),
    ).toBe(true);
  });
});

describe('ActivityToolbar', () => {
  const toolbar = (over: Partial<ComponentProps<typeof ActivityToolbar>> = {}) => (
    <ActivityToolbar
      query=""
      dropped={false}
      hidden={{}}
      exportable
      onQueryChange={() => undefined}
      onToggleKind={() => undefined}
      onExport={() => undefined}
      onClear={() => undefined}
      {...over}
    />
  );

  it('warns only when the peer closed the socket', () => {
    const { rerender } = render(toolbar());
    expect(screen.queryByText('Disconnected')).toBeNull();

    rerender(toolbar({ dropped: true }));
    expect(screen.getByText('Disconnected')).toBeTruthy();
  });

  it('marks each kind as shown or hidden and reports the change', () => {
    const toggled: ActivityKind[] = [];
    const { rerender } = render(
      toolbar({
        onToggleKind: (kind) => {
          toggled.push(kind);
        },
      }),
    );

    const status = screen.getByRole('button', { name: 'Status notes' });
    expect(status.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(status);
    expect(toggled).toEqual(['status']);

    rerender(toolbar({ hidden: { status: true } }));
    expect(screen.getByRole('button', { name: 'Status notes' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
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

    fireEvent.click(screen.getByRole('button', { name: 'Close detail' }));

    expect(screen.queryByTestId('activity-detail')).toBeNull();
    expect(useStore.getState().selectedActivityByConnection.c1 ?? null).toBeNull();
  });

  it('flags a dropped connection next to the log', () => {
    useStore.getState().setConnectionState('c1', 'dropped');
    render(<ActivityPanel connectionId="c1" />);

    expect(screen.getByText('Disconnected')).toBeTruthy();
  });

  // The strip answers for the whole session, so it is read from the running
  // totals and not from the records the log still happens to be holding. The
  // record count covers every kind; the two sides only count what crossed.
  it('reports what the connection moved, in a strip under the log', () => {
    render(<ActivityPanel connectionId="c1" />);

    act(() => {
      useStore.getState().appendActivity([
        record({ id: 'c1:2', kind: 'incoming', bytes: 2400 }),
        record({ id: 'c1:3', kind: 'outgoing', bytes: 12 }),
        record({ id: 'c1:4', kind: 'status', bytes: 0 }),
      ]);
    });

    const strip = within(screen.getByTestId('activity-totals'));
    expect(strip.getByLabelText('4 records')).toBeTruthy();
    expect(strip.getByLabelText('Received: 2 messages, 2,4 kB')).toBeTruthy();
    expect(strip.getByLabelText('Sent: 1 message, 12 B')).toBeTruthy();
  });

  // Below the split, not inside it: opening the detail must not shove the strip
  // around, and it describes the panel rather than the list.
  it('keeps the strip out of the scrolling body', () => {
    render(<ActivityPanel connectionId="c1" />);
    act(() => {
      useStore.getState().setSelectedActivity('c1', 'c1:1');
    });

    const strip = screen.getByTestId('activity-totals');
    expect(strip.closest('[data-part="panel-body"]')).toBeNull();
    expect(screen.getByTestId('activity-detail')).toBeTruthy();
  });
});
