import { useCallback, useState } from 'react';
import { createConnection, duplicateConnection } from '@shared/domain/factory.js';
import type { Connection } from '@shared/domain/types.js';
import { bridge } from '@/ipc/bridge.js';
import { useStore } from '@/store/index.js';

/** A module constant so an unloaded workspace keeps a stable empty list. */
const EMPTY_CONNECTIONS: Connection[] = [];

function connectionById(connectionId: string): Connection | undefined {
  return (useStore.getState().workspace?.connections ?? EMPTY_CONNECTIONS).find(
    (entry) => entry.id === connectionId,
  );
}

/**
 * Everything the tab strip can do to a connection, plus the two pieces of view
 * state that go with it: which tab is being renamed, and which one the delete
 * dialog is asking about.
 *
 * The callbacks read the store through `getState()` instead of subscribing, so
 * their identity never changes and the memoized tabs stay put while a
 * neighbouring connection is edited.
 */
export function useConnectionTabActions() {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const select = useCallback((connectionId: string) => {
    useStore.getState().setActiveConnection(connectionId);
  }, []);

  const startRename = useCallback((connectionId: string) => {
    setRenamingId(connectionId);
  }, []);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
  }, []);

  const rename = useCallback((connectionId: string, name: string) => {
    setRenamingId(null);
    const connection = connectionById(connectionId);
    if (connection === undefined || connection.name === name) return;
    useStore.getState().upsertConnection({ ...connection, name });
  }, []);

  const requestClose = useCallback((connectionId: string) => {
    setClosingId(connectionId);
  }, []);

  const cancelClose = useCallback(() => {
    setClosingId(null);
  }, []);

  const duplicate = useCallback((connectionId: string) => {
    const connection = connectionById(connectionId);
    if (connection === undefined) return;
    // A copy points at the same endpoint through the same environment and opens
    // the same way; only identity and name change. Through the factory so the
    // settings are copied rather than shared — a header added to one would
    // otherwise appear on the other. It carries no socket: it was never opened.
    const copy = duplicateConnection(connection, `${connection.name} (copia)`);
    const store = useStore.getState();
    store.upsertConnection(copy);
    store.setActiveConnection(copy.id);
  }, []);

  const configure = useCallback((connectionId: string) => {
    useStore.getState().openConnectionSettings(connectionId);
  }, []);

  const remove = useCallback((connectionId: string) => {
    setClosingId(null);
    // Dropping the tab without closing the socket would leave a live session in
    // the main process with no UI left to observe it.
    void bridge.connection.close({ connectionId }).catch((cause: unknown) => {
      console.error(cause);
    });

    const store = useStore.getState();
    const index = (store.workspace?.connections ?? EMPTY_CONNECTIONS).findIndex(
      (entry) => entry.id === connectionId,
    );
    store.removeConnection(connectionId);

    if (store.activeConnectionId !== connectionId) return;
    const remaining = useStore.getState().workspace?.connections ?? EMPTY_CONNECTIONS;
    // The neighbour that slid into the closed tab's place, or the last one.
    const next = remaining[Math.min(index, remaining.length - 1)];
    store.setActiveConnection(next?.id ?? null);
  }, []);

  const create = useCallback(() => {
    const connection = createConnection({ name: 'Nueva conexión' });
    const store = useStore.getState();
    store.upsertConnection(connection);
    store.setActiveConnection(connection.id);
    // Opened straight into its name: the placeholder is never what the tab is
    // meant to be called.
    setRenamingId(connection.id);
  }, []);

  return {
    renamingId,
    closingId,
    select,
    startRename,
    cancelRename,
    rename,
    requestClose,
    cancelClose,
    duplicate,
    configure,
    remove,
    create,
  };
}
