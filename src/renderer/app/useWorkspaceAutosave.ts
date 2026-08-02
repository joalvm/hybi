import { useEffect, useRef } from 'react';
import { bridge } from '@/ipc/bridge.js';
import { useStore } from '@/store/index.js';

/**
 * Persists the workspace after edits settle. The subscription compares object
 * identity, so runtime-only changes — activity, drafts, socket state — never
 * trigger a write.
 */
export function useWorkspaceAutosave(delayMs = 400): void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state, previous) => {
      if (state.workspace === null || state.workspace === previous.workspace) return;
      // A load is not an edit: bootstrap and workspace switching both install a
      // document that already matches what is on disk.
      if (previous.workspace?.id !== state.workspace.id) return;

      if (timer.current !== null) clearTimeout(timer.current);
      const snapshot = state.workspace;
      timer.current = setTimeout(() => {
        void bridge.workspace.save(snapshot).catch((error: unknown) => {
          console.error(error);
        });
      }, delayMs);
    });

    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
      unsubscribe();
    };
  }, [delayMs]);
}
