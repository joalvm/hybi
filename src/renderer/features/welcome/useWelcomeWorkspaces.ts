import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceSummary } from '@shared/domain/types.js';
import { bridge } from '@/ipc/bridge.js';

type ListStatus = 'loading' | 'ready' | 'error';

type WelcomeWorkspaces = {
  summaries: WorkspaceSummary[];
  status: ListStatus;
  error: string | null;
  open: (workspaceId: string) => void;
  create: (name: string) => void;
  /** Deletes a file that could not be read, and asks the list again. */
  discard: (workspaceId: string) => void;
};

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * What the welcome window can do: read the documents on disk and hand one to
 * the editor. It never installs a workspace in a store — the workbench window
 * is a different renderer, and it loads the document it was opened with.
 */
export function useWelcomeWorkspaces(): WelcomeWorkspaces {
  const [summaries, setSummaries] = useState<WorkspaceSummary[]>([]);
  const [status, setStatus] = useState<ListStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const fail = useCallback((cause: unknown) => {
    console.error(cause);
    setError(messageOf(cause));
    setStatus('error');
  }, []);

  const refresh = useCallback(() => {
    void bridge.workspace
      .list()
      .then((next) => {
        setSummaries(next);
        setStatus('ready');
      })
      .catch(fail);
  }, [fail]);

  useEffect(refresh, [refresh]);

  const open = useCallback(
    (workspaceId: string) => {
      void bridge.shell.openWorkspace(workspaceId).catch(fail);
    },
    [fail],
  );

  // Named here rather than renamed in the editor afterwards: the document is
  // created and opened in one step, and this window closes behind it.
  const create = useCallback(
    (name: string) => {
      void bridge.workspace
        .create(name)
        .then((workspace) => bridge.shell.openWorkspace(workspace.id))
        .catch(fail);
    },
    [fail],
  );

  // The file is unreadable, so there is nothing to close first and nothing to
  // recover: the row goes away once disk agrees it did.
  const discard = useCallback(
    (workspaceId: string) => {
      void bridge.workspace
        .remove(workspaceId)
        .then((result) => {
          if (result.ok) refresh();
          else fail(result.error);
        })
        .catch(fail);
    },
    [fail, refresh],
  );

  return { summaries, status, error, open, create, discard };
}
