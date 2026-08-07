import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cloneWebSocketSettings } from '@shared/domain/connections/defaults.js';
import { createWorkspace } from '@shared/domain/factory.js';
import type {
  WebSocketTransport,
  WebSocketTransportSettings,
} from '@shared/domain/connections/websocket.js';
import type { Result } from '@shared/ipc/contract.js';
import type { OpenConnectionRequest } from '@shared/transport/contract.js';
import { buildScope } from '@shared/variables/resolve.js';
import { ConnectionBar } from '@/features/connections/ConnectionBar.js';
import { ConnectionTabs } from '@/features/connections/ConnectionTabs.js';
import { ConnectionSettingsDialog } from '@/features/connections/settings/ConnectionSettingsDialog.js';
import { resolveWebSocketTransport } from '@/features/connections/websocket/resolve.js';
import { useStore } from '@/store/index.js';

const connectionBridge = vi.hoisted(() => ({
  // Typed with the request so the assertions can read what was actually sent.
  open: vi.fn<(request: OpenConnectionRequest) => Promise<Result<Record<never, never>>>>(() =>
    Promise.resolve({ ok: true }),
  ),
  close: vi.fn(() => Promise.resolve({ ok: true })),
  send: vi.fn(() => Promise.resolve({ ok: true, sequence: 1 })),
  onState: vi.fn(() => () => undefined),
  onActivity: vi.fn(() => () => undefined),
}));

vi.mock('@/ipc/bridge.js', () => ({ bridge: { connection: connectionBridge } }));

function settings(
  overrides: Partial<WebSocketTransportSettings> = {},
): WebSocketTransportSettings {
  return { ...cloneWebSocketSettings(), ...overrides };
}

function websocket(connectionSettings: WebSocketTransportSettings): WebSocketTransport {
  return { kind: 'websocket', url: 'ws://127.0.0.1:3000', settings: connectionSettings };
}

function loadWorkspace(connectionSettings: WebSocketTransportSettings = settings()): void {
  const workspace = createWorkspace('Demo');
  workspace.environments.push({
    id: 'env1',
    name: 'local',
    variables: [{ name: 'token', value: 'abc', secret: true }],
  });
  workspace.connections.push({
    id: 'c1',
    name: 'echo',
    environmentId: 'env1',
    transport: websocket(connectionSettings),
  });
  useStore.getState().setWorkspace(workspace);
  useStore.getState().setActiveConnection('c1');
}

function storedSettings(): WebSocketTransportSettings | undefined {
  const transport = useStore.getState().workspace?.connections[0]?.transport;
  return transport?.kind === 'websocket' ? transport.settings : undefined;
}

beforeEach(() => {
  useStore.getState().reset();
  connectionBridge.open.mockClear();
});

describe('resolveWebSocketTransport', () => {
  const scope = buildScope([{ name: 'token', value: 'abc', secret: true }]);

  it('substitutes a variable in a header value', () => {
    const resolved = resolveWebSocketTransport(
      websocket(
        settings({ headers: [{ name: 'Authorization', value: 'Bearer {{token}}', enabled: true }] }),
      ),
      scope,
    );

    expect(resolved.transport.headers).toEqual({ Authorization: 'Bearer abc' });
    expect(resolved.missing).toEqual([]);
  });

  it('reports a variable no environment defines', () => {
    const resolved = resolveWebSocketTransport(
      websocket(settings({ headers: [{ name: 'X-Key', value: '{{nope}}', enabled: true }] })),
      scope,
    );

    expect(resolved.missing).toEqual(['nope']);
  });

  it('leaves out a header that is switched off, and one with no name', () => {
    const resolved = resolveWebSocketTransport(
      websocket(settings({
        headers: [
          { name: 'X-Off', value: '1', enabled: false },
          { name: '', value: 'orphan', enabled: true },
          { name: 'X-On', value: '1', enabled: true },
        ],
      })),
      scope,
    );

    expect(resolved.transport.headers).toEqual({ 'X-On': '1' });
  });

  /**
   * The stored value is refused by the schema if it carries a break, but a
   * variable can carry one in — and CR or LF would end the header line and
   * start one nobody wrote.
   */
  it('strips a line break a variable smuggled into the value', () => {
    const injected = buildScope([{ name: 'evil', value: 'a\r\nX-Admin: true', secret: false }]);
    const resolved = resolveWebSocketTransport(
      websocket(settings({ headers: [{ name: 'X-Trace', value: '{{evil}}', enabled: true }] })),
      injected,
    );

    expect(resolved.transport.headers['X-Trace']).toBe('aX-Admin: true');
  });
});

describe('ConnectionBar with settings', () => {
  it('sends the resolved headers along with the URL', () => {
    loadWorkspace(
      settings({ headers: [{ name: 'Authorization', value: 'Bearer {{token}}', enabled: true }] }),
    );
    render(<ConnectionBar connectionId="c1" />);

    screen.getByRole('button', { name: 'Connect' }).click();

    expect(connectionBridge.open.mock.calls[0]?.[0].transport.headers).toEqual({
      Authorization: 'Bearer abc',
    });
  });

  it('refuses to connect while a header points at a variable nobody defined', () => {
    loadWorkspace(settings({ headers: [{ name: 'X-Key', value: '{{nope}}', enabled: true }] }));
    render(<ConnectionBar connectionId="c1" />);

    expect(screen.getByRole('button', { name: 'Connect' })).toHaveProperty('disabled', true);
  });

  it('opens the settings dialog from the gear', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionBar connectionId="c1" />);

    await user.click(screen.getByRole('button', { name: 'Connection settings' }));

    expect(useStore.getState().settingsConnectionId).toBe('c1');
  });
});

/** The rail decides which pane exists; Radix does not render the others. */
async function openTab(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('tab', { name }));
}

describe('ConnectionSettingsDialog', () => {
  it('groups the settings in a rail instead of one long form', () => {
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    expect(screen.getByRole('dialog').dataset.size).toBe('xl');
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Connection',
      'Headers',
      'Retry',
      'Keepalive',
    ]);
    // Only the first pane is mounted, which is the point of the rail.
    expect(screen.queryByLabelText('Attempts')).toBeNull();
    expect(screen.getByLabelText('Subprotocols')).toBeTruthy();
  });

  it('adds another header after the preloaded draft row', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);
    await openTab(user, 'Headers');

    await user.click(screen.getByRole('button', { name: 'Add header' }));

    expect(storedSettings()?.headers).toEqual([
      { name: '', value: '', enabled: true },
      { name: '', value: '', enabled: true },
    ]);
  });

  /** An empty list still offers the row where the first header is written. */
  it('starts the header pane with one empty draft row', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);
    await openTab(user, 'Headers');

    const name = screen.getByLabelText('Header name');
    expect(storedSettings()?.headers).toEqual([]);

    await user.type(name, 'X-Trace');

    expect(storedSettings()?.headers).toEqual([
      { name: 'X-Trace', value: '', enabled: true },
    ]);
  });

  it('writes a header into the connection as it is typed', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);
    await openTab(user, 'Headers');

    await user.type(screen.getByLabelText('Header name'), 'X-Key');
    // `{{` is how userEvent types one literal brace; `}` needs no escape.
    await user.type(screen.getByLabelText('Header value'), '{{{{token}}');

    expect(storedSettings()?.headers).toEqual([
      { name: 'X-Key', value: '{{token}}', enabled: true },
    ]);
  });

  it('removes a header', async () => {
    const user = userEvent.setup();
    loadWorkspace(settings({ headers: [{ name: 'X-Key', value: '1', enabled: true }] }));
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);
    await openTab(user, 'Headers');

    await user.click(screen.getByRole('button', { name: 'Remove X-Key' }));

    expect(storedSettings()?.headers).toEqual([]);
  });

  /** The one control here that removes a defence says so where it is switched. */
  it('warns for as long as certificate verification is off', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    expect(screen.queryByRole('alert')).toBeNull();

    await user.click(screen.getByRole('checkbox', { name: /Verify the server/ }));

    expect(storedSettings()?.verifyCertificate).toBe(false);
    expect(screen.getByRole('alert').textContent).toMatch(/sitting in the middle/);
  });

  it('commits a number only once the field is left', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);
    await openTab(user, 'Retry');

    const attempts = screen.getByLabelText('Attempts');
    expect(attempts).toHaveProperty('type', 'text');
    expect(attempts).toHaveProperty('inputMode', 'numeric');
    await user.clear(attempts);
    await user.type(attempts, '9');
    expect(storedSettings()?.retry.attempts).toBe(5);

    await user.tab();
    expect(storedSettings()?.retry.attempts).toBe(9);
  });

  it('clamps a number back into range on commit', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);
    await openTab(user, 'Retry');

    const attempts = screen.getByLabelText('Attempts');
    await user.clear(attempts);
    await user.type(attempts, '9999');
    await user.tab();

    expect(storedSettings()?.retry.attempts).toBe(100);
  });

  it('splits the subprotocol line when the field is left', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    await user.type(screen.getByLabelText('Subprotocols'), 'graphql-ws, wamp');
    await user.tab();

    expect(storedSettings()?.protocols).toEqual(['graphql-ws', 'wamp']);
  });

  it('says a live socket keeps the settings it opened with', () => {
    loadWorkspace();
    useStore.getState().setConnectionState('c1', 'open');
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    expect(screen.getByText(/applies the next time it connects/)).toBeTruthy();
  });
});

describe('connection tab menu', () => {
  it('opens the settings dialog from Settings', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionTabs />);

    await user.click(screen.getByRole('button', { name: 'Options for echo' }));
    await user.click(screen.getByRole('menuitem', { name: 'Settings' }));

    expect(screen.getByRole('dialog').textContent).toMatch(/Headers/);
  });

  it('gives a duplicated connection its own header list', async () => {
    const user = userEvent.setup();
    loadWorkspace(settings({ headers: [{ name: 'X-Key', value: '1', enabled: true }] }));
    render(<ConnectionTabs />);

    await user.click(screen.getByRole('button', { name: 'Options for echo' }));
    await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }));

    const connections = useStore.getState().workspace?.connections ?? [];
    expect(connections).toHaveLength(2);
    connections[1]?.transport.settings.headers.push({
      name: 'X-Other',
      value: '2',
      enabled: true,
    });
    expect(connections[0]?.transport.settings.headers).toHaveLength(1);
  });
});

describe('choosing the transport', () => {
  it('rebuilds the connection on the new transport, at its own defaults', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    await user.click(screen.getByRole('combobox', { name: 'Transport' }));
    await user.click(screen.getByRole('option', { name: 'Socket.IO' }));

    const transport = useStore.getState().workspace?.connections[0]?.transport;
    expect(transport?.kind).toBe('socketio');
    // Its own default endpoint: a `ws://` URL is not one a Socket.IO client dials.
    expect(transport?.url).toBe('http://127.0.0.1:3000');
  });

  it('shows the rail of the transport that was chosen', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    expect(screen.queryByRole('tab', { name: 'Keepalive' })).toBeTruthy();

    await user.click(screen.getByRole('combobox', { name: 'Transport' }));
    await user.click(screen.getByRole('option', { name: 'Socket.IO' }));

    expect(screen.getByRole('tab', { name: 'Auth' })).toBeTruthy();
    // Keepalive is the native socket's ping/pong; Socket.IO runs its own.
    expect(screen.queryByRole('tab', { name: 'Keepalive' })).toBeNull();
  });
});
