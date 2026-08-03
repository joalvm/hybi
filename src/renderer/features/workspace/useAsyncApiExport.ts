import { useCallback } from 'react';
import { bridge } from '@/ipc/bridge.js';
import { useStore } from '@/store/index.js';

/** Opens the native exporter with the current in-memory document, including pending edits. */
export function useAsyncApiExport(): () => void {
  return useCallback(() => {
    const workspace = useStore.getState().workspace;
    if (workspace === null) return;
    void bridge.asyncapi
      .export(workspace)
      .then((outcome) => {
        if (!outcome.ok && !('cancelled' in outcome)) console.error(outcome.error);
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }, []);
}
