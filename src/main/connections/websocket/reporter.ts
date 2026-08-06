import type { ActivityKind, ActivityRecord, ConnectionState } from '@shared/ipc/activity.js';
import { mainMessages } from '../../lang.js';
import { logEvent } from '../../log/index.js';
import type { TransportSessionSink } from '../transport.js';
import { diagnose, originOf } from './diagnose.js';

export type WebSocketReporter = {
  state(state: ConnectionState, detail?: string): void;
  record(kind: ActivityKind, label: string, body: string): number;
  /** A socket failure, said in words the user can act on and written to the log. */
  failure(error: unknown, url: string): number;
};

/** Owns observable state and sequence independently from socket attempts. */
export function createWebSocketReporter(
  connectionId: string,
  sink: TransportSessionSink,
): WebSocketReporter {
  let state: ConnectionState = 'idle';
  let sequence = 0;

  const reporter: WebSocketReporter = {
    state: (next, detail) => {
      if (state === next) return;
      state = next;
      // The state and the close code are diagnosable on their own; the frames
      // that crossed the socket are not part of what the log is allowed to see.
      logEvent('info', 'connection', `${connectionId} ${next}${detail === undefined ? '' : ` ${detail}`}`);
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
    failure: (error, url) => {
      const sentence = diagnose(error, url);
      logEvent('error', 'connection', `${connectionId} ${originOf(url)} ${sentence}`);
      return reporter.record('error', mainMessages().activity.kinds.error, sentence);
    },
  };

  return reporter;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
