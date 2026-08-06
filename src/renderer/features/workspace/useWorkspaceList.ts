import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceSummary } from '@shared/domain/types.js';
import { bridge } from '@/ipc/bridge.js';
import { useStore } from '@/store/index.js';
import { flush, install, openable } from './workspaceHandover.js';
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
        setSummaries(openable(next));
        setError(null);
        setStatus('ready');
      })
      .catch(fail);
  }, [fail]);

  useEffect(() => {
    void bridge.workspace
      .list()
      .then((next) => {
        setSummaries(openable(next));
        setStatus('ready');
      })
      .catch(fail);
  }, [fail]);

  const open = useCallback(
    async (workspaceId: string): Promise<boolean> => {
      try {
        await flush();
        install(await bridge.workspace.load(workspaceId));
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
