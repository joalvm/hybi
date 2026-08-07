import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cloneWebSocketSettings,
  DEFAULT_WEBSOCKET_SETTINGS,
} from '@shared/domain/connections/defaults.js';
import { createWorkspace } from '@shared/domain/factory.js';
import type { Result } from '@shared/ipc/contract.js';
import { ConnectButton } from '@/features/connections/ConnectButton.js';
import { ConnectionBar } from '@/features/connections/ConnectionBar.js';
import { ConnectionTabs } from '@/features/connections/ConnectionTabs.js';
import { EN } from '@lang/en/index.js';
import { stateLabel } from '@/features/connections/state-label.js';
import { useStore } from '@/store/index.js';

/** Hoisted so the module factory below can close over the same spies. */
const connectionBridge = vi.hoisted(() => ({
  open: vi.fn<() => Promise<Result<Record<never, never>>>>(() => Promise.resolve({ ok: true })),
  close: vi.fn<() => Promise<Result<Record<never, never>>>>(() => Promise.resolve({ ok: true })),
  dispose: vi.fn<() => Promise<Result<Record<never, never>>>>(() => Promise.resolve({ ok: true })),
  send: vi.fn(),
  onState: vi.fn(() => () => undefined),
  onActivity: vi.fn(() => () => undefined),
}));

vi.mock('@/ipc/bridge.js', () => ({ bridge: { connection: connectionBridge } }));

function loadWorkspace(url: string, environmentId: string | null = null): void {
  const workspace = createWorkspace('Demo');
  workspace.environments.push({
    id: 'env1',
    name: 'local',
    variables: [{ name: 'host', value: '127.0.0.1:9001', secret: false }],
  });
  workspace.connections.push(
    {
      id: 'c1',
      name: 'Connection A',
      environmentId,
      transport: { kind: 'websocket', url, settings: cloneWebSocketSettings() },
    },
    {
      id: 'c2',
      name: 'Connection B',
      environmentId: null,
      transport: {
        kind: 'websocket',
        url: 'ws://127.0.0.1:3000',
        settings: cloneWebSocketSettings(),
      },
    },
  );
  useStore.getState().setWorkspace(workspace);
  useStore.getState().setActiveConnection('c1');
}

/** The URL field is a contenteditable, so an edit is text plus an input event. */
function typeUrl(text: string): HTMLElement {
  const field = screen.getByLabelText('URL');
  field.textContent = text;
  fireEvent.input(field);
  return field;
}

function urlOf(connectionId: string): string | undefined {
  const connection = useStore
    .getState()
    .workspace?.connections.find((entry) => entry.id === connectionId);
  return connection?.transport.url;
}

beforeEach(() => {
  useStore.getState().reset();
  connectionBridge.open.mockClear();
  connectionBridge.close.mockClear();
  connectionBridge.dispose.mockClear();
  connectionBridge.open.mockImplementation(() => Promise.resolve({ ok: true }));
});

describe('stateLabel', () => {
  it('maps every state to its label and a tone', () => {
    expect(stateLabel('idle', EN.connections.states)).toEqual({ text: 'Disconnected', tone: 'neutral' });
    expect(stateLabel('connecting', EN.connections.states)).toEqual({ text: 'Connecting', tone: 'warn' });
    expect(stateLabel('open', EN.connections.states)).toEqual({ text: 'Connected', tone: 'ok' });
    expect(stateLabel('closing', EN.connections.states)).toEqual({ text: 'Closing', tone: 'warn' });
    expect(stateLabel('closed', EN.connections.states)).toEqual({ text: 'Disconnected', tone: 'neutral' });
    expect(stateLabel('dropped', EN.connections.states)).toEqual({ text: 'Disconnected', tone: 'warn' });
    expect(stateLabel('error', EN.connections.states)).toEqual({ text: 'Error', tone: 'error' });
  });
});

describe('ConnectButton', () => {
  it('connects when closed', () => {
    const onConnect = vi.fn();
    render(
      <ConnectButton state="idle" canConnect onConnect={onConnect} onDisconnect={() => undefined} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^connect$/i }));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('disconnects when open', () => {
    const onDisconnect = vi.fn();
    render(
      <ConnectButton
        state="open"
        canConnect
        onConnect={() => undefined}
        onDisconnect={onDisconnect}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^disconnect$/i }));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it('is disabled while the URL still has unresolved variables', () => {
    render(
      <ConnectButton
        state="idle"
        canConnect={false}
        onConnect={() => undefined}
        onDisconnect={() => undefined}
      />,
    );
    expect(screen.getByRole('button', { name: /^connect$/i })).toHaveProperty('disabled', true);
  });
});

describe('ConnectionBar', () => {
  it('sends the resolved URL to the bridge', () => {
    loadWorkspace('ws://{{host}}/socket', 'env1');
    render(<ConnectionBar connectionId="c1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    expect(connectionBridge.open).toHaveBeenCalledWith({
      connectionId: 'c1',
      transport: {
        kind: 'websocket',
        url: 'ws://127.0.0.1:9001/socket',
        headers: {},
        protocols: [],
        retry: DEFAULT_WEBSOCKET_SETTINGS.retry,
        keepalive: DEFAULT_WEBSOCKET_SETTINGS.keepalive,
        verifyCertificate: true,
        maxMessageBytes: DEFAULT_WEBSOCKET_SETTINGS.maxMessageBytes,
      },
    });
  });

  // The counter answers for the whole session, so it is read from the running
  // totals and not from the records the log still happens to be holding.
  it('reports what the connection has moved, in both directions', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionBar connectionId="c1" />);

    expect(screen.getByLabelText('Received: 0 messages, 0 B')).toBeTruthy();

    act(() => {
      useStore.getState().appendActivity([
        {
          id: 'c1:1',
          connectionId: 'c1',
          transportKind: 'websocket',
          sequence: 1,
          kind: 'incoming',
          at: 0,
          label: 'Pong',
          body: 'x',
          encoding: 'text',
          bytes: 2400,
        },
        {
          id: 'c1:2',
          connectionId: 'c1',
          transportKind: 'websocket',
          sequence: 2,
          kind: 'outgoing',
          at: 1,
          label: 'Ping',
          body: 'x',
          encoding: 'text',
          bytes: 12,
        },
      ]);
    });

    expect(screen.getByLabelText('Received: 1 message, 2,4 kB')).toBeTruthy();
    expect(screen.getByLabelText('Sent: 1 message, 12 B')).toBeTruthy();
  });

  it('refuses to open while a variable is unresolved', () => {
    loadWorkspace('ws://{{host}}/socket', null);
    render(<ConnectionBar connectionId="c1" />);

    expect(screen.getByRole('button', { name: 'Connect' })).toHaveProperty('disabled', true);
    expect(connectionBridge.open).not.toHaveBeenCalled();
  });

  /** The main process wrote the reason to the activity log; the bar stays quiet. */
  it('shows no failure text of its own when the main process rejects the URL', async () => {
    connectionBridge.open.mockImplementation(() =>
      Promise.resolve({ ok: false, error: 'unsupported protocol' }),
    );
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionBar connectionId="c1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(useStore.getState().states.c1).toBe('error');
    });
    expect(screen.queryByText('unsupported protocol')).toBeNull();
  });

  /** A rejected bridge call never reached the main process, so it logs itself. */
  it('reports a bridge failure in the activity log', async () => {
    connectionBridge.open.mockImplementation(() => Promise.reject(new Error('bridge caído')));
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionBar connectionId="c1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(useStore.getState().states.c1).toBe('error');
    });
    expect(useStore.getState().activity.c1?.map((record) => [record.kind, record.body])).toEqual([
      ['error', 'bridge caído'],
    ]);
    expect(screen.queryByText('bridge caído')).toBeNull();
  });

  /** Connection state reads from the button; a peer close is flagged in the log. */
  it('shows no state badge of its own', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    useStore.getState().setConnectionState('c1', 'dropped');
    render(<ConnectionBar connectionId="c1" />);

    expect(screen.queryByText('Disconnected')).toBeNull();
  });

  it('writes the URL back to the connection', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionBar connectionId="c1" />);

    typeUrl('ws://{{host}}');

    expect(urlOf('c1')).toBe('ws://{{host}}');
  });

  /** The picker moved to the app chrome, where it applies across connections. */
  it('does not offer an environment picker of its own', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionBar connectionId="c1" />);

    expect(screen.queryByLabelText('Environment')).toBeNull();
  });

  it('closes an open socket instead of reopening it', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    useStore.getState().setConnectionState('c1', 'open');
    render(<ConnectionBar connectionId="c1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(connectionBridge.close).toHaveBeenCalledWith({ connectionId: 'c1' });
    expect(connectionBridge.open).not.toHaveBeenCalled();
  });

  it('waits before opening the variable popover instead of flashing it', () => {
    vi.useFakeTimers();
    try {
      loadWorkspace('ws://{{host}}/socket', 'env1');
      render(<ConnectionBar connectionId="c1" />);

      fireEvent.pointerOver(screen.getByText('{{host}}'));
      expect(screen.queryByLabelText('Value of host')).toBeNull();

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(screen.getByLabelText('Value of host')).toHaveProperty('value', '127.0.0.1:9001');
      expect(screen.queryByRole('button', { name: 'Environment local' })).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  /** Both halves of the bug that made the panel impossible to type into. */
  it('survives the pointer crossing into the popover and then leaving it', () => {
    vi.useFakeTimers();
    try {
      loadWorkspace('ws://{{host}}/socket', 'env1');
      render(<ConnectionBar connectionId="c1" />);

      const token = screen.getByText('{{host}}');
      fireEvent.pointerOver(token);
      act(() => {
        vi.advanceTimersByTime(400);
      });
      const panel = document.querySelector('[data-part="variable-popover"]');
      if (panel === null) throw new Error('Popover never opened');

      // Reaching the panel means leaving the token first: the gap between them
      // must not be read as an instruction to close.
      fireEvent.pointerOut(token);
      fireEvent.pointerEnter(panel);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.queryByLabelText('Value of host')).not.toBeNull();

      // And once the caret is in the field, the pointer is free to wander off.
      screen.getByLabelText('Value of host').focus();
      fireEvent.pointerLeave(panel);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.queryByLabelText('Value of host')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('writes an edited variable value back to its environment', () => {
    vi.useFakeTimers();
    try {
      loadWorkspace('ws://{{host}}/socket', 'env1');
      render(<ConnectionBar connectionId="c1" />);

      fireEvent.pointerOver(screen.getByText('{{host}}'));
      act(() => {
        vi.advanceTimersByTime(400);
      });

      const field = screen.getByLabelText('Value of host');
      fireEvent.change(field, { target: { value: '10.0.0.2:9001' } });
      fireEvent.blur(field);

      const environment = useStore
        .getState()
        .workspace?.environments.find((entry) => entry.id === 'env1');
      expect(environment?.variables[0]?.value).toBe('10.0.0.2:9001');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows environment suggestions after the second opening brace', () => {
    loadWorkspace('ws://', 'env1');
    useStore.getState().setEnvironmentVariables('env1', [
      { name: 'host', value: '127.0.0.1:9001', secret: false },
      { name: 'token', value: 'abc', secret: false },
    ]);
    render(<ConnectionBar connectionId="c1" />);

    typeUrl('ws://{{to');

    expect(screen.queryByRole('listbox', { name: 'Environment variables' })).not.toBeNull();
    expect(screen.queryByRole('option', { name: /token/ })).not.toBeNull();
    expect(screen.queryByRole('option', { name: /host/ })).toBeNull();
    expect(screen.queryByText('abc')).not.toBeNull();
    expect(screen.getByText('{{to').classList.contains('wsw-var-pending')).toBe(true);
  });

  it('dismisses the suggestions with Escape without clearing the URL', () => {
    loadWorkspace('ws://{{ho', 'env1');
    render(<ConnectionBar connectionId="c1" />);

    const field = screen.getByLabelText('URL');
    expect(screen.queryByRole('option', { name: /host/ })).not.toBeNull();
    fireEvent.keyDown(field, { key: 'Escape' });

    expect(screen.queryByRole('listbox', { name: 'Environment variables' })).toBeNull();
    expect(urlOf('c1')).toBe('ws://{{ho');
  });

  it('inserts the selected environment variable into the URL', () => {
    loadWorkspace('ws://{{ho', 'env1');
    render(<ConnectionBar connectionId="c1" />);

    fireEvent.click(screen.getByRole('option', { name: /host/ }));

    expect(urlOf('c1')).toBe('ws://{{host}}');
  });

  it('selects filtered suggestions with the keyboard', () => {
    loadWorkspace('ws://{{', 'env1');
    useStore.getState().setEnvironmentVariables('env1', [
      { name: 'host', value: '127.0.0.1:9001', secret: false },
      { name: 'token', value: 'abc', secret: false },
    ]);
    render(<ConnectionBar connectionId="c1" />);

    const field = screen.getByLabelText('URL');
    const optionAt = (index: number): HTMLElement => {
      const option = screen.getAllByRole('option')[index];
      if (option === undefined) throw new Error(`Missing suggestion at index ${String(index)}`);
      return option;
    };

    expect(optionAt(0).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    expect(optionAt(1).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(field, { key: 'ArrowUp' });
    expect(optionAt(0).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(field, { key: 'Enter' });

    expect(urlOf('c1')).toBe('ws://{{host}}');
  });

  it('pastes into the URL as one line of plain text', () => {
    loadWorkspace('', null);
    render(<ConnectionBar connectionId="c1" />);

    fireEvent.paste(screen.getByLabelText('URL'), {
      clipboardData: { getData: () => 'ws://127.0.0.1:3000\n' },
    });

    expect(urlOf('c1')).toBe('ws://127.0.0.1:3000');
  });

  it('marks unresolved URL variables with the destructive tone', () => {
    loadWorkspace('ws://{{missing}}', 'env1');
    render(<ConnectionBar connectionId="c1" />);

    expect(screen.getByText('{{missing}}').classList.contains('wsw-var-missing')).toBe(true);
  });
});

describe('ConnectionTabs', () => {
  it('renders one tab per connection and activates the one clicked', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionTabs />);

    fireEvent.click(screen.getByRole('button', { name: 'Connection B' }));

    expect(useStore.getState().activeConnectionId).toBe('c2');
  });

  it('creates and activates a connection', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionTabs />);

    fireEvent.click(screen.getByRole('button', { name: 'New connection' }));

    const connections = useStore.getState().workspace?.connections ?? [];
    expect(connections).toHaveLength(3);
    expect(useStore.getState().activeConnectionId).toBe(connections[2]?.id);
  });

  it('renames a connection from its own tab', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionTabs />);

    fireEvent.doubleClick(screen.getByRole('button', { name: 'Connection A' }));
    const field = screen.getByLabelText('Connection name');
    fireEvent.change(field, { target: { value: 'Staging' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    expect(useStore.getState().workspace?.connections[0]?.name).toBe('Staging');
    expect(screen.queryByLabelText('Connection name')).toBeNull();
  });

  it('opens a new connection straight into its name', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionTabs />);

    fireEvent.click(screen.getByRole('button', { name: 'New connection' }));
    const field = screen.getByLabelText('Connection name');
    fireEvent.change(field, { target: { value: 'Producción' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    expect(useStore.getState().workspace?.connections.at(-1)?.name).toBe('Producción');
  });

  it('disposes the socket and falls back to a sibling when the active tab goes', async () => {
    const user = userEvent.setup();
    loadWorkspace('ws://127.0.0.1:3000', null);
    useStore.getState().setConnectionState('c1', 'open');
    useStore.getState().setDraft('c1', 'e1', '{"a":1}');
    render(<ConnectionTabs />);

    await user.click(screen.getByRole('button', { name: 'Options for Connection A' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    // The confirm dialog is modal, so the tab strip behind it is aria-hidden
    // and this query resolves to the dialog's own action, uniquely.
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    // `dispose`, not `close`: the connection is gone, so the main process has no
    // session left to keep either.
    expect(connectionBridge.dispose).toHaveBeenCalledWith({ connectionId: 'c1' });
    expect(useStore.getState().workspace?.connections.map((entry) => entry.id)).toEqual(['c2']);
    expect(useStore.getState().activeConnectionId).toBe('c2');
    // Nothing the session built around that tab outlives it.
    expect(useStore.getState().states.c1).toBeUndefined();
    expect(useStore.getState().drafts['c1:e1']).toBeUndefined();
  });
});

describe('connection tab menu', () => {
  it('asks before deleting and leaves the connection alone on cancel', async () => {
    const user = userEvent.setup();
    useStore.getState().reset();
    useStore.setState({
      workspace: {
        id: 'w1',
        version: 1,
        name: 'local',
        environments: [],
        connections: [
          {
            id: 'k1',
            name: 'echo',
            environmentId: null,
            transport: {
              kind: 'websocket',
              url: 'ws://a',
              settings: cloneWebSocketSettings(),
            },
          },
        ],
        catalog: { collections: [], items: [] },
      },
      activeConnectionId: 'k1',
    });

    render(<ConnectionTabs />);

    expect(screen.queryByRole('button', { name: 'Close echo' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Options for echo' }));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Rename',
      'Duplicate',
      'Settings',
      'Delete',
    ]);

    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useStore.getState().workspace?.connections).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Options for echo' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(useStore.getState().workspace?.connections).toHaveLength(0);
  });
});
