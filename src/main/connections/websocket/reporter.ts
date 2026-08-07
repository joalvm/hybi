import type { ActivityKind, ActivityRecord, ConnectionState } from '@shared/ipc/activity.js';
import { mainMessages } from '../../lang.js';
import { logEvent } from '../../log/index.js';
import type { TransportSessionSink } from '../transport.js';
import { diagnose, originOf } from '../diagnose.js';
import { textFrame, type Frame } from './frame.js';

export type WebSocketReporter = {
  state(state: ConnectionState, detail?: string): void;
  /**
   * The frame is passed whole rather than as text plus flags: it arrives already
   * measured from the socket, and re-deriving its size here would guess at a
   * binary payload from the base64 that carries it.
   */
  record(kind: ActivityKind, label: string, frame: Frame): number;
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
    record: (kind, label, frame) => {
      sequence += 1;
      const record: ActivityRecord = {
        id: `${connectionId}:${String(sequence)}`,
        connectionId,
        transportKind: 'websocket',
        sequence,
        kind,
        at: Date.now(),
        label,
        body: frame.body,
        encoding: frame.encoding,
        bytes: frame.bytes,
      };
      sink.activity(record);
      return sequence;
    },
    failure: (error, url) => {
      const sentence = diagnose(error, url);
      logEvent('error', 'connection', `${connectionId} ${originOf(url)} ${sentence}`);
      return reporter.record('error', mainMessages().activity.kinds.error, textFrame(sentence));
    },
  };

  return reporter;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
