import { useCallback } from 'react';
import type { PayloadEncoding } from '@shared/binary/encoding.js';
import type { TransportKind } from '@shared/domain/types.js';
import type {
  SocketIoArgument,
  TransportFactoryMap,
  TransportMessage,
} from '@shared/transport/contract.js';
import { bridge } from '@/ipc/bridge.js';

/**
 * Everything the composer has to say, before a transport decides how to say it.
 * Each factory reads only the fields its own protocol has a place for: a raw
 * socket has nowhere to put an event name, and Socket.IO has no frame to hang
 * an encoding on — it emits a value, not bytes.
 */
export type OutgoingDraft = {
  /** Text as written, or base64 when the payload is bytes. */
  body: string;
  encoding: PayloadEncoding;
  event: string;
  argument: SocketIoArgument;
  ack: boolean;
};

const MESSAGE_FACTORIES = {
  websocket: (draft: OutgoingDraft): TransportMessage => ({
    kind: 'websocket',
    body: draft.body,
    encoding: draft.encoding,
  }),
  socketio: (draft: OutgoingDraft): TransportMessage => ({
    kind: 'socketio',
    event: draft.event,
    body: draft.body,
    argument: draft.argument,
    ack: draft.ack,
  }),
} satisfies TransportFactoryMap<(draft: OutgoingDraft) => TransportMessage>;

type Input = OutgoingDraft & {
  connectionId: string;
  transportKind: TransportKind | null;
  appendLocalError: (connectionId: string, transportKind: TransportKind, body: string) => void;
};

/** Sends the resolved payload and reports bridge failures through local activity. */
export function useSendMessage({
  connectionId,
  transportKind,
  body,
  encoding,
  event,
  argument,
  ack,
  appendLocalError,
}: Input): () => void {
  return useCallback((): void => {
    if (transportKind === null) return;
    const message = MESSAGE_FACTORIES[transportKind]({ body, encoding, event, argument, ack });
    void bridge.connection
      .send({ connectionId, message })
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
  }, [ack, appendLocalError, argument, body, connectionId, encoding, event, transportKind]);
}
