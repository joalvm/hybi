import type { ActivityKind, ActivityRecord, ConnectionState } from '@shared/ipc/activity.js';
import type { TransportSessionSink } from '../transport.js';

export type WebSocketReporter = {
  state(state: ConnectionState, detail?: string): void;
  record(kind: ActivityKind, label: string, body: string): number;
};

/** Owns observable state and sequence independently from socket attempts. */
export function createWebSocketReporter(
  connectionId: string,
  sink: TransportSessionSink,
): WebSocketReporter {
  let state: ConnectionState = 'idle';
  let sequence = 0;

  return {
    state: (next, detail) => {
      if (state === next) return;
      state = next;
      sink.state(next, detail);
    },
    record: (kind, label, body) => {
      sequence += 1;
      const record: ActivityRecord = {
        id: `${connectionId}:${String(sequence)}`,
        connectionId,
        transportKind: 'websocket',
        sequence,
        kind,
        at: Date.now(),
        label,
        body,
        bytes: Buffer.byteLength(body, 'utf8'),
      };
      sink.activity(record);
      return sequence;
    },
  };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
