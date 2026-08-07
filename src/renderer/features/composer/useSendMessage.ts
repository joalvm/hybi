import { useCallback } from 'react';
import type { PayloadEncoding } from '@shared/binary/encoding.js';
import type { TransportKind } from '@shared/domain/types.js';
import type { TransportFactoryMap, TransportMessage } from '@shared/transport/contract.js';
import { bridge } from '@/ipc/bridge.js';

const MESSAGE_FACTORIES = {
  websocket: (body: string, encoding: PayloadEncoding): TransportMessage => ({
    kind: 'websocket',
    body,
    encoding,
  }),
} satisfies TransportFactoryMap<(body: string, encoding: PayloadEncoding) => TransportMessage>;

type Input = {
  connectionId: string;
  transportKind: TransportKind | null;
  /** Text as written, or base64 when the payload is bytes. */
  body: string;
  encoding: PayloadEncoding;
  appendLocalError: (connectionId: string, transportKind: TransportKind, body: string) => void;
};

/** Sends the resolved payload and reports bridge failures through local activity. */
export function useSendMessage({
  connectionId,
  transportKind,
  body,
  encoding,
  appendLocalError,
}: Input): () => void {
  return useCallback((): void => {
    if (transportKind === null) return;
    void bridge.connection
      .send({ connectionId, message: MESSAGE_FACTORIES[transportKind](body, encoding) })
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
  }, [appendLocalError, body, connectionId, encoding, transportKind]);
}
