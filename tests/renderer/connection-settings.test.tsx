import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cloneConnectionSettings } from '@shared/domain/defaults.js';
import { createWorkspace } from '@shared/domain/factory.js';
import type { ConnectionSettings } from '@shared/domain/types.js';
import type { OpenRequest, Result } from '@shared/ipc/contract.js';
import { buildScope } from '@shared/variables/resolve.js';
import { ConnectionBar } from '@/features/connections/ConnectionBar.js';
import { ConnectionTabs } from '@/features/connections/ConnectionTabs.js';
import { ConnectionSettingsDialog } from '@/features/connections/settings/ConnectionSettingsDialog.js';
import { resolveSocketOptions } from '@/features/connections/socket-options.js';
import { useStore } from '@/store/index.js';

const ws = vi.hoisted(() => ({
  // Typed with the request so the assertions can read what was actually sent.
  open: vi.fn<(request: OpenRequest) => Promise<Result<Record<never, never>>>>(() =>
    Promise.resolve({ ok: true }),
  ),
  close: vi.fn(() => Promise.resolve({ ok: true })),
  send: vi.fn(() => Promise.resolve({ ok: true, sequence: 1 })),
  onState: vi.fn(() => () => undefined),
  onActivity: vi.fn(() => () => undefined),
}));

vi.mock('@/ipc/bridge.js', () => ({ bridge: { ws } }));

function settings(overrides: Partial<ConnectionSettings> = {}): ConnectionSettings {
  return { ...cloneConnectionSettings(), ...overrides };
}

function loadWorkspace(connectionSettings: ConnectionSettings = settings()): void {
  const workspace = createWorkspace('Demo');
  workspace.environments.push({
    id: 'env1',
    name: 'local',
    variables: [{ name: 'token', value: 'abc', secret: true }],
  });
  workspace.connections.push({
    id: 'c1',
    name: 'echo',
    url: 'ws://127.0.0.1:3000',
    environmentId: 'env1',
    settings: connectionSettings,
  });
  useStore.getState().setWorkspace(workspace);
  useStore.getState().setActiveConnection('c1');
}

function storedSettings(): ConnectionSettings | undefined {
  return useStore.getState().workspace?.connections[0]?.settings;
}

beforeEach(() => {
  useStore.getState().reset();
  ws.open.mockClear();
});

describe('resolveSocketOptions', () => {
  const scope = buildScope([{ name: 'token', value: 'abc', secret: true }]);

  it('substitutes a variable in a header value', () => {
    const resolved = resolveSocketOptions(
      settings({ headers: [{ name: 'Authorization', value: 'Bearer {{token}}', enabled: true }] }),
      scope,
    );

    expect(resolved.options.headers).toEqual({ Authorization: 'Bearer abc' });
    expect(resolved.missing).toEqual([]);
  });

  it('reports a variable no environment defines', () => {
    const resolved = resolveSocketOptions(
      settings({ headers: [{ name: 'X-Key', value: '{{nope}}', enabled: true }] }),
      scope,
    );

    expect(resolved.missing).toEqual(['nope']);
  });

  it('leaves out a header that is switched off, and one with no name', () => {
    const resolved = resolveSocketOptions(
      settings({
        headers: [
          { name: 'X-Off', value: '1', enabled: false },
          { name: '', value: 'orphan', enabled: true },
          { name: 'X-On', value: '1', enabled: true },
        ],
      }),
      scope,
    );

    expect(resolved.options.headers).toEqual({ 'X-On': '1' });
  });

  /**
   * The stored value is refused by the schema if it carries a break, but a
   * variable can carry one in — and CR or LF would end the header line and
   * start one nobody wrote.
   */
  it('strips a line break a variable smuggled into the value', () => {
    const injected = buildScope([{ name: 'evil', value: 'a\r\nX-Admin: true', secret: false }]);
    const resolved = resolveSocketOptions(
      settings({ headers: [{ name: 'X-Trace', value: '{{evil}}', enabled: true }] }),
      injected,
    );

    expect(resolved.options.headers['X-Trace']).toBe('aX-Admin: true');
  });
});

describe('ConnectionBar with settings', () => {
  it('sends the resolved headers along with the URL', () => {
    loadWorkspace(
      settings({ headers: [{ name: 'Authorization', value: 'Bearer {{token}}', enabled: true }] }),
    );
    render(<ConnectionBar connectionId="c1" />);

    screen.getByRole('button', { name: 'Conectar' }).click();

    expect(ws.open.mock.calls[0]?.[0].options?.headers).toEqual({ Authorization: 'Bearer abc' });
  });

  it('refuses to connect while a header points at a variable nobody defined', () => {
    loadWorkspace(settings({ headers: [{ name: 'X-Key', value: '{{nope}}', enabled: true }] }));
    render(<ConnectionBar connectionId="c1" />);

    expect(screen.getByRole('button', { name: 'Conectar' })).toHaveProperty('disabled', true);
  });

  it('opens the settings dialog from the gear', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionBar connectionId="c1" />);

    await user.click(screen.getByRole('button', { name: 'Configuración de la conexión' }));

    expect(useStore.getState().settingsConnectionId).toBe('c1');
  });
});

describe('ConnectionSettingsDialog', () => {
  it('uses a compact settings surface and controls', () => {
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    expect(screen.getByRole('dialog').className).toContain('dialog--settings');
    expect(screen.getByRole('dialog').querySelector('.dialog-body--settings')).not.toBeNull();
    expect(screen.getByLabelText('Intentos').className).toContain('settings-control');
  });

  it('keeps the Headers action compact in its section title', () => {
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    expect(screen.getByRole('heading', { name: 'Headers' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Añadir cabecera' }).className).toContain(
      'settings-section__add',
    );
    expect(screen.getByRole('button', { name: 'Añadir cabecera' }).className).toContain(
      'settings-section__add--inline',
    );
  });

  it('writes a header into the connection as it is typed', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    await user.click(screen.getByRole('button', { name: 'Añadir cabecera' }));
    await user.type(screen.getByLabelText('Nombre de la cabecera'), 'X-Key');
    // `{{` is how userEvent types one literal brace; `}` needs no escape.
    await user.type(screen.getByLabelText('Valor de la cabecera'), '{{{{token}}');

    expect(storedSettings()?.headers).toEqual([
      { name: 'X-Key', value: '{{token}}', enabled: true },
    ]);
  });

  it('removes a header', async () => {
    const user = userEvent.setup();
    loadWorkspace(settings({ headers: [{ name: 'X-Key', value: '1', enabled: true }] }));
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    await user.click(screen.getByRole('button', { name: 'Quitar X-Key' }));

    expect(storedSettings()?.headers).toEqual([]);
  });

  /** The one control here that removes a defence says so where it is switched. */
  it('warns for as long as certificate verification is off', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    expect(screen.queryByRole('alert')).toBeNull();

    await user.click(screen.getByRole('checkbox', { name: /Verificar el certificado/ }));

    expect(storedSettings()?.verifyCertificate).toBe(false);
    expect(screen.getByRole('alert').textContent).toMatch(/interponga/);
  });

  it('commits a number only once the field is left', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    const attempts = screen.getByLabelText('Intentos');
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

    const attempts = screen.getByLabelText('Intentos');
    await user.clear(attempts);
    await user.type(attempts, '9999');
    await user.tab();

    expect(storedSettings()?.retry.attempts).toBe(100);
  });

  it('splits the subprotocol line when the field is left', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    await user.type(screen.getByLabelText('Subprotocolos'), 'graphql-ws, wamp');
    await user.tab();

    expect(storedSettings()?.protocols).toEqual(['graphql-ws', 'wamp']);
  });

  it('says a live socket keeps the settings it opened with', () => {
    loadWorkspace();
    useStore.getState().setConnectionState('c1', 'open');
    render(<ConnectionSettingsDialog connectionId="c1" onClose={() => undefined} />);

    expect(screen.getByText(/al volver a conectar/)).toBeTruthy();
  });
});

describe('connection tab menu', () => {
  it('opens the settings dialog from Configuración', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ConnectionTabs />);

    await user.click(screen.getByRole('button', { name: 'Opciones de echo' }));
    await user.click(screen.getByRole('menuitem', { name: 'Configuración' }));

    expect(screen.getByRole('dialog').textContent).toMatch(/Headers/);
  });

  it('gives a duplicated connection its own header list', async () => {
    const user = userEvent.setup();
    loadWorkspace(settings({ headers: [{ name: 'X-Key', value: '1', enabled: true }] }));
    render(<ConnectionTabs />);

    await user.click(screen.getByRole('button', { name: 'Opciones de echo' }));
    await user.click(screen.getByRole('menuitem', { name: 'Duplicar' }));

    const connections = useStore.getState().workspace?.connections ?? [];
    expect(connections).toHaveLength(2);
    connections[1]?.settings.headers.push({ name: 'X-Other', value: '2', enabled: true });
    expect(connections[0]?.settings.headers).toHaveLength(1);
  });
});
