import { useCallback, useEffect, useState } from 'react';
import { ensureStarterConnection } from '@shared/domain/factory.js';
import type { Workspace, WorkspaceSummary } from '@shared/domain/types.js';
import { bridge } from '@/ipc/bridge.js';
import { useStore } from '@/store/index.js';
type ListStatus = 'loading' | 'ready' | 'error';
type WorkspaceList = {
  summaries: WorkspaceSummary[];
  status: ListStatus;
  error: string | null;
  refresh: () => void;
  open: (workspaceId: string) => Promise<boolean>;
  create: (name: string) => Promise<boolean>;
  duplicate: (name: string) => Promise<boolean>;
  remove: () => void;
};

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Installs a document before the main editor opens. The store is reset first so no
 * connection id from the previous workspace survives inside the record-shaped
 * slices, and autosave stays quiet: a load is not an edit.
 */
function install(workspace: Workspace): Workspace {
  const ready = ensureStarterConnection(workspace);
  const store = useStore.getState();
  store.reset();
  store.setWorkspace(ready);
  const first = ready.connections[0];
  if (first !== undefined) store.setActiveConnection(first.id);
  return ready;
}

/**
 * Autosave is debounced, so the file can be up to a moment behind the store.
 * Anything that reads the file — switching away, duplicating — writes first.
 */
async function flush(): Promise<void> {
  const current = useStore.getState().workspace;
  if (current !== null) await bridge.workspace.save(current);
}

/** The workspaces on disk plus every operation the menu offers over them. */
export function useWorkspaceList(): WorkspaceList {
  const [summaries, setSummaries] = useState<WorkspaceSummary[]>([]);
  const [status, setStatus] = useState<ListStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const fail = useCallback((cause: unknown) => {
    console.error(cause);
    setError(messageOf(cause));
    setStatus('error');
  }, []);

  const refresh = useCallback(() => {
    setStatus('loading');
    void bridge.workspace
      .list()
      .then((next) => {
        setSummaries(next);
        setError(null);
        setStatus('ready');
      })
      .catch(fail);
  }, [fail]);

  useEffect(() => {
    void bridge.workspace
      .list()
      .then((next) => {
        setSummaries(next);
        setStatus('ready');
      })
      .catch(fail);
  }, [fail]);

  const open = useCallback(
    async (workspaceId: string): Promise<boolean> => {
      try {
        await flush();
        const workspace = await bridge.workspace.load(workspaceId);
        const ready = install(workspace);
        if (ready !== workspace) await bridge.workspace.save(ready);
        refresh();
        return true;
      } catch (cause: unknown) {
        fail(cause);
        return false;
      }
    },
    [fail, refresh],
  );

  const create = useCallback(
    async (name: string): Promise<boolean> => {
      try {
        await flush();
        install(await bridge.workspace.create(name));
        refresh();
        return true;
      } catch (cause: unknown) {
        fail(cause);
        return false;
      }
    },
    [fail, refresh],
  );

  const duplicate = useCallback(
    async (name: string): Promise<boolean> => {
      const current = useStore.getState().workspace;
      if (current === null) return false;
      try {
        await flush();
        install(await bridge.workspace.duplicate(current.id, name));
        refresh();
        return true;
      } catch (cause: unknown) {
        fail(cause);
        return false;
      }
    },
    [fail, refresh],
  );

  const remove = useCallback(() => {
    const current = useStore.getState().workspace;
    if (current === null) return;
    void bridge.workspace
      .remove(current.id)
      .then((result) => {
        if (!result.ok) {
          fail(result.error);
          return;
        }
        // `null` opens the next most recent one, or creates a fresh workspace
        // when that was the last one on disk.
        return bridge.workspace.load(null).then((workspace) => {
          install(workspace);
          refresh();
        });
      })
      .catch(fail);
  }, [fail, refresh]);

  return { summaries, status, error, refresh, open, create, duplicate, remove };
}
