import { useEffect, useState } from 'react';
import { bridge } from '@/ipc/bridge.js';
import { useStore } from '@/store/index.js';

type Bootstrap = { status: 'loading' | 'ready' } | { status: 'error'; message: string };

/**
 * Loads the document this window was opened with. The id comes from the main
 * process, so a reload lands on the same workspace instead of the most recent
 * one — and the welcome window stays the only place a document is chosen.
 *
 * An effect because this is I/O on mount, not derived state.
 */
export function useWorkspaceBootstrap(): Bootstrap {
  const [state, setState] = useState<Bootstrap>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    void bridge.workspace
      .load(bridge.workspaceId)
      .then((loaded) => {
        if (!active) return;
        const store = useStore.getState();
        store.setWorkspace(loaded);
        const first = loaded.connections[0];
        if (first !== undefined) store.setActiveConnection(first.id);
        setState({ status: 'ready' });
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error(error);
        setState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
