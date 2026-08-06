import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkspace } from '@shared/domain/factory.js';
import type { ImportOutcome } from '@shared/ipc/contract.js';
import { CatalogPanel } from '@/features/catalog/CatalogPanel.js';
import { useStore } from '@/store/index.js';

const runImport = vi.fn<() => Promise<ImportOutcome>>();

// The preload is the one module a renderer test cannot have: it is the process
// boundary. The store is real, as everywhere else in this suite.
vi.mock('@/ipc/bridge.js', () => ({
  bridge: {
    asyncapi: {
      import: () => runImport(),
    },
  },
}));

const imported: ImportOutcome = {
  ok: true,
  sourceName: 'asyncapi.json',
  collections: [{ id: 'k1', name: 'devices' }],
  items: [
    { id: 'i1', collectionId: 'k1', name: 'DeviceLogin', payload: '{}', source: 'asyncapi' },
  ],
};

/** A promise the test settles by hand, standing in for a slow parse in the main process. */
function pending(): (outcome: ImportOutcome) => Promise<void> {
  let settle: (outcome: ImportOutcome) => void = () => undefined;
  runImport.mockReturnValue(
    new Promise<ImportOutcome>((resolve) => {
      settle = resolve;
    }),
  );
  return async (outcome) => {
    settle(outcome);
    // Inside `act`, so the microtasks that follow the promise — the store write
    // and the flag going back down — are flushed before the assertions run.
    await act(async () => {
      await Promise.resolve();
    });
  };
}

beforeEach(() => {
  runImport.mockReset();
  useStore.getState().reset();
  useStore.getState().setWorkspace(createWorkspace('Demo'));
});

describe('AsyncAPI import', () => {
  it('reports the wait and refuses a second import until the first one lands', async () => {
    const settle = pending();
    render(<CatalogPanel connectionId="c1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Import AsyncAPI' }));

    expect(screen.getByRole('status').textContent).toContain('Reading the AsyncAPI document…');
    expect(screen.getByRole('button', { name: 'Importing AsyncAPI…' })).toHaveProperty(
      'disabled',
      true,
    );

    await settle(imported);

    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('DeviceLogin')).toBeTruthy();
  });

  /** Cancelling the picker is an outcome: the wait has to end either way. */
  it('stops waiting when the native dialog is cancelled', async () => {
    const settle = pending();
    render(<CatalogPanel connectionId="c1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Import AsyncAPI' }));
    await settle({ ok: false, cancelled: true, error: 'cancelled' });

    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('button', { name: 'Import AsyncAPI' })).toHaveProperty(
      'disabled',
      false,
    );
  });

  it('stops waiting when the document cannot be read', async () => {
    const settle = pending();
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<CatalogPanel connectionId="c1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Import AsyncAPI' }));
    await settle({ ok: false, error: 'no es un documento AsyncAPI' });

    expect(screen.queryByRole('status')).toBeNull();
    expect(logged).toHaveBeenCalledWith('no es un documento AsyncAPI');
    logged.mockRestore();
  });
});
