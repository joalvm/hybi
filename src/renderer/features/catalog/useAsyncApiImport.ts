import { useCallback, useState } from 'react';
import { bridge } from '@/ipc/bridge.js';
import { useStore } from '@/store/index.js';

export type AsyncApiImport = {
  /** True from the moment the picker opens until the catalog has the events. */
  importing: boolean;
  start: () => void;
};

/**
 * A real AsyncAPI document takes seconds to read: the main process parses and
 * validates it while the renderer waits on a single promise. Without a flag the
 * app looks hung — nothing moves, nothing says why — so the wait is reported and
 * the button refuses a second import until the first one lands.
 */
export function useAsyncApiImport(): AsyncApiImport {
  const addImported = useStore((state) => state.addImported);
  const [importing, setImporting] = useState(false);

  const start = useCallback(() => {
    setImporting(true);
    void bridge.asyncapi
      .import()
      .then((outcome) => {
        if (outcome.ok) {
          addImported(outcome.collections, outcome.items);
          return;
        }
        // Cancelling the native dialog is an outcome, not a failure worth logging.
        if (!('cancelled' in outcome)) console.error(outcome.error);
      })
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => {
        setImporting(false);
      });
  }, [addImported]);

  return { importing, start };
}
