import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkspace } from '@shared/domain/factory.js';
import type { Workspace } from '@shared/domain/types.js';

const current: Workspace = { ...createWorkspace('Demo'), id: 'w1' };
const other: Workspace = { ...createWorkspace('Otro'), id: 'w2' };
const created: Workspace = { ...createWorkspace('Staging'), id: 'w3' };

const summaries = [
  { id: 'w1', name: 'Demo', updatedAt: '2026-07-29T10:00:00.000Z' },
  { id: 'w2', name: 'Otro', updatedAt: '2026-07-29T09:00:00.000Z' },
];

const workspaceBridge = {
  list: vi.fn(() => Promise.resolve(summaries)),
  load: vi.fn(() => Promise.resolve(other)),
  save: vi.fn(() => Promise.resolve({ ok: true as const, savedAt: '2026-07-29T10:00:00.000Z' })),
  create: vi.fn(() => Promise.resolve(created)),
  duplicate: vi.fn(() => Promise.resolve(created)),
  remove: vi.fn(() => Promise.resolve({ ok: true as const })),
};

vi.mock('@/ipc/bridge.js', () => ({
  bridge: {
    connection: {
      open: vi.fn(),
      close: vi.fn(),
      send: vi.fn(),
      onState: () => () => undefined,
      onActivity: () => () => undefined,
    },
    workspace: workspaceBridge,
    asyncapi: { import: vi.fn() },
  },
}));

const { useStore } = await import('@/store/index.js');
const { WorkspaceMenu } = await import('@/features/workspace/WorkspaceMenu.js');

/** Radix's trigger opens on pointerdown rather than click. */
async function openMenu(): Promise<void> {
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Workspace' }));
  await waitFor(() => {
    expect(screen.getByRole('menuitem', { name: 'Otro' })).toBeTruthy();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useStore.getState().reset();
  useStore.getState().setWorkspace(current);
  render(<WorkspaceMenu />);
});

describe('WorkspaceMenu', () => {
  it('lists every workspace', async () => {
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Workspace' }));

    expect(screen.getByText('Workspaces')).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: /Demo/ })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Nuevo workspace' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Eliminar' })).toBeTruthy();
  });

  /**
   * The switcher reads first and the admin actions sit below it, behind a
   * divider — regression coverage for the order, not just the presence, of
   * the two blocks: a menu that puts "Nuevo workspace" back on top would pass
   * every other assertion here but must fail this one.
   */
  it('lists the switcher above the admin actions', async () => {
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Workspace' }));

    const names = screen.getAllByRole('menuitem').map((item) => item.textContent);
    const lastWorkspace = names.indexOf('Otro');
    const firstAction = names.indexOf('Nuevo workspace');

    expect(lastWorkspace).toBeGreaterThanOrEqual(0);
    expect(firstAction).toBeGreaterThan(lastWorkspace);
  });

  it('switches to another workspace after saving the open one', async () => {
    await openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Otro' }));

    await waitFor(() => {
      expect(useStore.getState().workspace?.id).toBe('w2');
    });
    // Autosave is debounced, so the switch writes first or the last edits would
    // be gone by the time the file is read again.
    expect(workspaceBridge.save).toHaveBeenCalledWith(current);
    expect(workspaceBridge.load).toHaveBeenCalledWith('w2');
  });

  it('renames through the store, not through a channel of its own', async () => {
    await openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Renombrar' }));
    const field = screen.getByLabelText('Nombre del workspace');
    fireEvent.change(field, { target: { value: 'Producción' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    expect(useStore.getState().workspace?.name).toBe('Producción');
    expect(useStore.getState().workspace?.id).toBe('w1');
  });

  it('creates a workspace and opens it', async () => {
    await openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Nuevo workspace' }));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Staging' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(useStore.getState().workspace?.id).toBe('w3');
    });
    expect(workspaceBridge.create).toHaveBeenCalledWith('Staging');
  });

  it('asks before deleting and then opens what is left', async () => {
    await openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Eliminar' }));
    expect(workspaceBridge.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(useStore.getState().workspace?.id).toBe('w2');
    });
    expect(workspaceBridge.remove).toHaveBeenCalledWith('w1');
    expect(workspaceBridge.load).toHaveBeenCalledWith(null);
  });
});
