import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkspace } from '@shared/domain/factory.js';
import type { Workspace, WorkspaceSummary } from '@shared/domain/types.js';

const created: Workspace = { ...createWorkspace('Proyecto nuevo'), id: 'w2' };

const workspaceBridge = {
  list: vi.fn<() => Promise<WorkspaceSummary[]>>(() =>
    Promise.resolve([{ id: 'w1', name: 'Demo vacío', updatedAt: '2026-08-01T12:00:00.000Z' }]),
  ),
  load: vi.fn(),
  save: vi.fn(),
  create: vi.fn(() => Promise.resolve(created)),
  duplicate: vi.fn(),
  remove: vi.fn(),
};

const shellBridge = { openWorkspace: vi.fn(() => Promise.resolve()) };

vi.mock('@/ipc/bridge.js', () => ({
  bridge: {
    workspace: workspaceBridge,
    shell: shellBridge,
    window: {
      minimize: vi.fn(),
      toggleMaximize: vi.fn(),
      close: vi.fn(),
      isMaximized: vi.fn(() => Promise.resolve(false)),
      onMaximizedChange: () => () => undefined,
      popupAppMenu: vi.fn(),
    },
    platform: 'win32',
    role: 'welcome',
    workspaceId: null,
    app: {
      version: '0.3.0-alpha.1',
      onAboutRequested: () => () => undefined,
      onPreferencesRequested: () => () => undefined,
    },
  },
}));

const { WelcomeApp } = await import('@/app/WelcomeApp.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Welcome window', () => {
  it('lists saved workspaces without opening one', async () => {
    render(<WelcomeApp />);

    expect(await screen.findByRole('button', { name: 'Open Demo vacío' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create workspace' })).toBeTruthy();
    expect(shellBridge.openWorkspace).not.toHaveBeenCalled();
    expect(workspaceBridge.load).not.toHaveBeenCalled();
  });

  /**
   * The document is opened by the main process in the workbench window, so this
   * window's job ends at naming the one it wants.
   */
  it('hands a saved workspace to the workbench window', async () => {
    const user = userEvent.setup();
    render(<WelcomeApp />);

    await user.click(await screen.findByRole('button', { name: 'Open Demo vacío' }));

    expect(shellBridge.openWorkspace).toHaveBeenCalledWith('w1');
  });

  it('names a new workspace before opening it, instead of renaming it afterwards', async () => {
    const user = userEvent.setup();
    render(<WelcomeApp />);

    await user.click(await screen.findByRole('button', { name: 'Create workspace' }));
    await user.type(await screen.findByRole('textbox', { name: 'Name' }), 'Proyecto nuevo');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(workspaceBridge.create).toHaveBeenCalledWith('Proyecto nuevo');
    await waitFor(() => {
      expect(shellBridge.openWorkspace).toHaveBeenCalledWith('w2');
    });
  });

  it('places the workspace list before the left-bound Hybi flight', async () => {
    render(<WelcomeApp />);

    const workspaces = await screen.findByRole('region', { name: 'Your workspaces' });
    const flight = screen.getByRole('figure', { name: 'Hybi travelling to the left' });

    expect(workspaces.compareDocumentPosition(flight) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(
      0,
    );
  });

  /** Fixed size and not minimisable, so offering either button would be a lie. */
  it('carries close and nothing else', async () => {
    render(<WelcomeApp />);

    expect(await screen.findByRole('button', { name: 'Close' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Minimise' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Maximise' })).toBeNull();
  });

  /**
   * The worst failure this product can have used to be silent: the row simply
   * vanished and the user concluded the work was gone.
   */
  it('reports a file it could not read instead of hiding it', async () => {
    workspaceBridge.list.mockResolvedValueOnce([
      { id: 'w1', name: 'Demo vacío', updatedAt: '2026-08-01T12:00:00.000Z' },
      {
        id: 'roto',
        name: 'roto.json',
        updatedAt: new Date(0).toISOString(),
        broken: { path: '/data/workspaces/roto.json', reason: 'Unexpected end of JSON input' },
      },
    ]);

    render(<WelcomeApp />);

    expect(await screen.findByText('/data/workspaces/roto.json')).toBeTruthy();
    expect(screen.getByText('Unexpected end of JSON input')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Open roto.json' })).toBeNull();
  });

  it('discards an unreadable file only after it is confirmed', async () => {
    workspaceBridge.list.mockResolvedValueOnce([
      {
        id: 'roto',
        name: 'roto.json',
        updatedAt: new Date(0).toISOString(),
        broken: { path: '/data/workspaces/roto.json', reason: 'Unexpected end of JSON input' },
      },
    ]);
    workspaceBridge.remove.mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();

    render(<WelcomeApp />);
    await user.click(await screen.findByRole('button', { name: 'Discard roto.json' }));
    expect(workspaceBridge.remove).not.toHaveBeenCalled();

    await user.click(await screen.findByRole('button', { name: 'Discard' }));

    await waitFor(() => {
      expect(workspaceBridge.remove).toHaveBeenCalledWith('roto');
    });
    expect(await screen.findByRole('button', { name: 'Open Demo vacío' })).toBeTruthy();
  });

  it('says why the list is empty when it could not be read', async () => {
    workspaceBridge.list.mockRejectedValueOnce(new Error('disco lleno'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<WelcomeApp />);

    expect((await screen.findByRole('alert')).textContent).toContain('disco lleno');
  });
});
