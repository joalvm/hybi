import { useCallback } from 'react';
import type { ActivitySecret } from '@shared/ipc/activity.js';
import { bridge } from '@/ipc/bridge.js';
import { useStore } from '@/store/index.js';
import { selectScopeFor } from '@/store/selectors.js';

/**
 * Sends one connection's log to the main process, which asks for a path and
 * writes it. Everything is read through `getState()` at call time, so the
 * callback keeps one identity while the socket floods the store.
 *
 * The secrets travel with it. A sent frame carries the substituted text, so the
 * bearer token the workspace file never stores is in the log verbatim, and the
 * exported copy is the one that ends up attached to an issue. The main process
 * puts `{{name}}` back where each value was.
 */
export function useActivityExport(connectionId: string): () => void {
  return useCallback(() => {
    const state = useStore.getState();
    const connection = state.workspace?.connections.find((entry) => entry.id === connectionId);
    const records = state.activity[connectionId] ?? [];
    if (connection === undefined || records.length === 0) return;

    const secrets: ActivitySecret[] = [...selectScopeFor(connectionId)(state).values()]
      .filter((variable) => variable.secret && variable.value !== '')
      .map((variable) => ({ name: variable.name, value: variable.value }));

    void bridge.activity
      .export({ connectionName: connection.name, records, secrets })
      .then((outcome) => {
        // A cancelled dialog is an answer, not a failure. Anything else belongs
        // in the log, which is the only place this app reports errors.
        if (outcome.ok || 'cancelled' in outcome) return;
        useStore
          .getState()
          .appendLocalError(
            connectionId,
            connection.transport.kind,
            `No se pudo exportar la actividad: ${outcome.error}`,
          );
      });
  }, [connectionId]);
}
