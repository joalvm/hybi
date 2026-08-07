import type {
  ActivityKind,
  ConnectionState,
  SocketIoActivityRecord,
} from '@shared/ipc/activity.js';
import { mainMessages } from '../../lang.js';
import { logEvent } from '../../log/index.js';
import { diagnose, originOf } from '../diagnose.js';
import { textFrame, type Frame } from '../frame.js';
import type { TransportSessionSink } from '../transport.js';

/** What a line was, beyond the frame itself: its event name and whether it answers one. */
export type Line = { event: string; ack?: boolean };

export type SocketIoReporter = {
  state(state: ConnectionState, detail?: string): void;
  record(kind: ActivityKind, label: string, frame: Frame, line?: Line): number;
  /** A connection failure, said in words the user can act on and written to the log. */
  failure(error: unknown, url: string): number;
};

/** Owns observable state and sequence independently from client attempts. */
export function createSocketIoReporter(
  connectionId: string,
  sink: TransportSessionSink,
): SocketIoReporter {
  let state: ConnectionState = 'idle';
  let sequence = 0;

  const reporter: SocketIoReporter = {
    state: (next, detail) => {
      if (state === next) return;
      state = next;
      // The state and its reason are diagnosable on their own; the arguments
      // that crossed the connection are not part of what the log may see.
      logEvent('info', 'connection', `${connectionId} ${next}${detail === undefined ? '' : ` ${detail}`}`);
      sink.state(next, detail);
    },
    record: (kind, label, frame, line) => {
      sequence += 1;
      const record: SocketIoActivityRecord = {
        id: `${connectionId}:${String(sequence)}`,
        connectionId,
        transportKind: 'socketio',
        sequence,
        kind,
        at: Date.now(),
        label,
        body: frame.body,
        encoding: frame.encoding,
        bytes: frame.bytes,
        event: line?.event ?? '',
        ack: line?.ack ?? false,
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
