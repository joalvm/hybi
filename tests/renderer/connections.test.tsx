import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
import { stateLabel } from '@/features/connections/state-label.js';
import { useStore } from '@/store/index.js';

/** Hoisted so the module factory below can close over the same spies. */
const connectionBridge = vi.hoisted(() => ({
  open: vi.fn<() => Promise<Result<Record<never, never>>>>(() => Promise.resolve({ ok: true })),
  close: vi.fn<() => Promise<Result<Record<never, never>>>>(() => Promise.resolve({ ok: true })),
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
      name: 'Conexión A',
      environmentId,
      transport: { kind: 'websocket', url, settings: cloneWebSocketSettings() },
    },
    {
      id: 'c2',
      name: 'Conexión B',
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

beforeEach(() => {
  useStore.getState().reset();
  connectionBridge.open.mockClear();
  connectionBridge.close.mockClear();
  connectionBridge.open.mockImplementation(() => Promise.resolve({ ok: true }));
});

describe('stateLabel', () => {
  it('maps every state to Spanish copy and a tone', () => {
    expect(stateLabel('idle')).toEqual({ text: 'Desconectado', tone: 'neutral' });
    expect(stateLabel('connecting')).toEqual({ text: 'Conectando', tone: 'warn' });
    expect(stateLabel('open')).toEqual({ text: 'Conectado', tone: 'ok' });
    expect(stateLabel('closing')).toEqual({ text: 'Cerrando', tone: 'warn' });
    expect(stateLabel('closed')).toEqual({ text: 'Desconectado', tone: 'neutral' });
    expect(stateLabel('dropped')).toEqual({ text: 'Desconectado', tone: 'warn' });
    expect(stateLabel('error')).toEqual({ text: 'Error', tone: 'error' });
  });
});

describe('ConnectButton', () => {
  it('connects when closed', () => {
    const onConnect = vi.fn();
    render(
      <ConnectButton state="idle" canConnect onConnect={onConnect} onDisconnect={() => undefined} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /conectar/i }));
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
    fireEvent.click(screen.getByRole('button', { name: /desconectar/i }));
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
    expect(screen.getByRole('button', { name: /conectar/i })).toHaveProperty('disabled', true);
  });
});

describe('ConnectionBar', () => {
  it('sends the resolved URL to the bridge', () => {
    loadWorkspace('ws://{{host}}/socket', 'env1');
    render(<ConnectionBar connectionId="c1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

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

  it('refuses to open while a variable is unresolved', () => {
    loadWorkspace('ws://{{host}}/socket', null);
    render(<ConnectionBar connectionId="c1" />);

    expect(screen.getByRole('button', { name: 'Conectar' })).toHaveProperty('disabled', true);
    expect(connectionBridge.open).not.toHaveBeenCalled();
  });

  /** The main process wrote the reason to the activity log; the bar stays quiet. */
  it('shows no failure text of its own when the main process rejects the URL', async () => {
    connectionBridge.open.mockImplementation(() =>
      Promise.resolve({ ok: false, error: 'unsupported protocol' }),
    );
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionBar connectionId="c1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

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

    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

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

    expect(screen.queryByText('Desconectado')).toBeNull();
  });

  it('writes the URL back to the connection', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionBar connectionId="c1" />);

    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'ws://{{host}}' } });

    const connection = useStore.getState().workspace?.connections.find((entry) => entry.id === 'c1');
    expect(connection?.transport.url).toBe('ws://{{host}}');
  });

  /** The picker moved to the app chrome, where it applies across connections. */
  it('does not offer an environment picker of its own', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionBar connectionId="c1" />);

    expect(screen.queryByLabelText('Entorno')).toBeNull();
  });

  it('closes an open socket instead of reopening it', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    useStore.getState().setConnectionState('c1', 'open');
    render(<ConnectionBar connectionId="c1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Desconectar' }));

    expect(connectionBridge.close).toHaveBeenCalledWith({ connectionId: 'c1' });
    expect(connectionBridge.open).not.toHaveBeenCalled();
  });
});

describe('ConnectionTabs', () => {
  it('renders one tab per connection and activates the one clicked', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionTabs />);

    fireEvent.click(screen.getByRole('button', { name: 'Conexión B' }));

    expect(useStore.getState().activeConnectionId).toBe('c2');
  });

  it('creates and activates a connection', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionTabs />);

    fireEvent.click(screen.getByRole('button', { name: 'Nueva conexión' }));

    const connections = useStore.getState().workspace?.connections ?? [];
    expect(connections).toHaveLength(3);
    expect(useStore.getState().activeConnectionId).toBe(connections[2]?.id);
  });

  it('renames a connection from its own tab', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionTabs />);

    fireEvent.doubleClick(screen.getByRole('button', { name: 'Conexión A' }));
    const field = screen.getByLabelText('Nombre de la conexión');
    fireEvent.change(field, { target: { value: 'Staging' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    expect(useStore.getState().workspace?.connections[0]?.name).toBe('Staging');
    expect(screen.queryByLabelText('Nombre de la conexión')).toBeNull();
  });

  it('opens a new connection straight into its name', () => {
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionTabs />);

    fireEvent.click(screen.getByRole('button', { name: 'Nueva conexión' }));
    const field = screen.getByLabelText('Nombre de la conexión');
    fireEvent.change(field, { target: { value: 'Producción' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    expect(useStore.getState().workspace?.connections.at(-1)?.name).toBe('Producción');
  });

  it('closes the socket and falls back to a sibling when the active tab goes', async () => {
    const user = userEvent.setup();
    loadWorkspace('ws://127.0.0.1:3000', null);
    render(<ConnectionTabs />);

    await user.click(screen.getByRole('button', { name: 'Opciones de Conexión A' }));
    await user.click(screen.getByRole('menuitem', { name: 'Eliminar' }));
    // The confirm dialog is modal, so the tab strip behind it is aria-hidden
    // and this query resolves to the dialog's own action, uniquely.
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(connectionBridge.close).toHaveBeenCalledWith({ connectionId: 'c1' });
    expect(useStore.getState().workspace?.connections.map((entry) => entry.id)).toEqual(['c2']);
    expect(useStore.getState().activeConnectionId).toBe('c2');
  });
});

describe('connection tab menu', () => {
  it('asks before deleting and leaves the connection alone on cancel', async () => {
    const user = userEvent.setup();
    useStore.getState().reset();
    useStore.setState({
      workspace: {
        id: 'w1',
        version: 4,
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

    expect(screen.queryByRole('button', { name: 'Cerrar echo' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Opciones de echo' }));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Renombrar',
      'Duplicar',
      'Configuración',
      'Eliminar',
    ]);

    await user.click(screen.getByRole('menuitem', { name: 'Eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(useStore.getState().workspace?.connections).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Opciones de echo' }));
    await user.click(screen.getByRole('menuitem', { name: 'Eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(useStore.getState().workspace?.connections).toHaveLength(0);
  });
});
