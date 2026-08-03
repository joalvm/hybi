import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkspace } from '@shared/domain/factory.js';

const current = { ...createWorkspace('Demo'), id: 'workspace-1' };
const exportAsyncApi = vi.fn(() => Promise.resolve({ ok: true as const }));

vi.mock('@/ipc/bridge.js', () => ({
  bridge: {
    workspace: {
      list: vi.fn(() => Promise.resolve([])),
      load: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
      duplicate: vi.fn(),
      remove: vi.fn(),
    },
    asyncapi: { import: vi.fn(), export: exportAsyncApi },
  },
}));

const { useStore } = await import('@/store/index.js');
const { WorkspaceMenu } = await import('@/features/workspace/WorkspaceMenu.js');

beforeEach(() => {
  vi.clearAllMocks();
  useStore.getState().reset();
  useStore.getState().setWorkspace(current);
  render(<WorkspaceMenu />);
});

describe('workspace export', () => {
  it('exports the complete open workspace as AsyncAPI', async () => {
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Workspace' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Exportar como AsyncAPI' }));

    await waitFor(() => {
      expect(exportAsyncApi).toHaveBeenCalledWith(current);
    });
  });
});
