import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkspace } from '@shared/domain/factory.js';
import type { Workspace } from '@shared/domain/types.js';

const saved: Workspace[] = [];
const workspace = createWorkspace('ViiA');

vi.mock('@/ipc/bridge.js', () => ({
  bridge: {
    connection: {
      open: vi.fn(),
      close: vi.fn(),
      send: vi.fn(),
      onState: () => () => undefined,
      onActivity: () => () => undefined,
    },
    workspace: {
      list: vi.fn(),
      load: vi.fn(() => Promise.resolve(workspace)),
      save: vi.fn((next: Workspace) => {
        saved.push(next);
        return Promise.resolve({ ok: true as const, savedAt: '2026-07-29T00:00:00.000Z' });
      }),
    },
    asyncapi: { import: vi.fn() },
  },
}));

const { useStore } = await import('@/store/index.js');
const { useWorkspaceAutosave } = await import('@/app/useWorkspaceAutosave.js');

beforeEach(() => {
  saved.length = 0;
  useStore.getState().reset();
});

describe('useWorkspaceAutosave', () => {
  it('saves after an edit settles and not before', async () => {
    vi.useFakeTimers();
    useStore.getState().setWorkspace(workspace);
    renderHook(() => {
      useWorkspaceAutosave(300);
    });

    act(() => {
      useStore.getState().addEnvironment('local');
    });
    expect(saved).toHaveLength(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(saved).toHaveLength(1);
    expect(saved[0]?.environments[0]?.name).toBe('local');
    vi.useRealTimers();
  });

  it('does not save the workspace it just loaded', async () => {
    vi.useFakeTimers();
    renderHook(() => {
      useWorkspaceAutosave(300);
    });

    act(() => {
      useStore.getState().setWorkspace(workspace);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(saved).toHaveLength(0);
    vi.useRealTimers();
  });
});
