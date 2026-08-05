import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkspace } from '@shared/domain/factory.js';
import type { Workspace } from '@shared/domain/types.js';

const created: Workspace = { ...createWorkspace('Proyecto nuevo'), id: 'w2' };

const workspaceBridge = {
  list: vi.fn(() =>
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
      locale: 'es-PE',
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

    expect(await screen.findByRole('button', { name: 'Abrir Demo vacío' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Crear workspace' })).toBeTruthy();
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

    await user.click(await screen.findByRole('button', { name: 'Abrir Demo vacío' }));

    expect(shellBridge.openWorkspace).toHaveBeenCalledWith('w1');
  });

  it('names a new workspace before opening it, instead of renaming it afterwards', async () => {
    const user = userEvent.setup();
    render(<WelcomeApp />);

    await user.click(await screen.findByRole('button', { name: 'Crear workspace' }));
    await user.type(await screen.findByRole('textbox', { name: 'Nombre' }), 'Proyecto nuevo');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(workspaceBridge.create).toHaveBeenCalledWith('Proyecto nuevo');
    await waitFor(() => {
      expect(shellBridge.openWorkspace).toHaveBeenCalledWith('w2');
    });
  });

  it('places the workspace list before the left-bound Hybi flight', async () => {
    render(<WelcomeApp />);

    const workspaces = await screen.findByRole('region', { name: 'Tus workspaces' });
    const flight = screen.getByRole('figure', { name: 'Hybi viajando hacia la izquierda' });

    expect(workspaces.compareDocumentPosition(flight) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(
      0,
    );
  });

  /** Fixed size and not minimisable, so offering either button would be a lie. */
  it('carries close and nothing else', async () => {
    render(<WelcomeApp />);

    expect(await screen.findByRole('button', { name: 'Cerrar' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Minimizar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Maximizar' })).toBeNull();
  });

  it('says why the list is empty when it could not be read', async () => {
    workspaceBridge.list.mockRejectedValueOnce(new Error('disco lleno'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<WelcomeApp />);

    expect((await screen.findByRole('alert')).textContent).toContain('disco lleno');
  });
});
