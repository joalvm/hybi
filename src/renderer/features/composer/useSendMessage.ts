import { useCallback } from 'react';
import type { TransportKind } from '@shared/domain/types.js';
import type { TransportFactoryMap, TransportMessage } from '@shared/transport/contract.js';
import { bridge } from '@/ipc/bridge.js';

const MESSAGE_FACTORIES = {
  websocket: (text: string): TransportMessage => ({ kind: 'websocket', text }),
} satisfies TransportFactoryMap<(text: string) => TransportMessage>;

type Input = {
  connectionId: string;
  transportKind: TransportKind | null;
  text: string;
  appendLocalError: (connectionId: string, transportKind: TransportKind, body: string) => void;
};

/** Sends resolved text and reports bridge failures through local activity. */
export function useSendMessage({
  connectionId,
  transportKind,
  text,
  appendLocalError,
}: Input): () => void {
  return useCallback((): void => {
    if (transportKind === null) return;
    void bridge.connection
      .send({ connectionId, message: MESSAGE_FACTORIES[transportKind](text) })
      .then((result) => {
        if (!result.ok) appendLocalError(connectionId, transportKind, result.error);
      })
      .catch((cause: unknown) => {
        appendLocalError(
          connectionId,
          transportKind,
          cause instanceof Error ? cause.message : String(cause),
        );
      });
  }, [appendLocalError, connectionId, text, transportKind]);
}
