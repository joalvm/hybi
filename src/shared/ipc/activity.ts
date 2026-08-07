import type { PayloadEncoding } from '../binary/encoding.js';
import type { TransportKind } from '../domain/connections/connection.js';

/**
 * `closed` and `dropped` are both a shut socket; they differ in who shut it.
 * `dropped` means the peer did, which is the only close worth warning about —
 * the user already knows about the ones they asked for.
 */
export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'closing'
  | 'closed'
  | 'dropped'
  | 'error';

export type ActivityKind = 'outgoing' | 'incoming' | 'status' | 'error';

/**
 * One line in the activity log. `body` is exactly what crossed the socket, read
 * through `encoding`; `label` is only a display hint derived from it. `bytes` is
 * always the size on the wire, so a binary frame is counted by what it weighed
 * and not by the length of the base64 that carries it.
 */
type TransportActivityRecord<TKind extends TransportKind> = {
  id: string;
  connectionId: string;
  transportKind: TKind;
  sequence: number;
  kind: ActivityKind;
  at: number;
  label: string;
  body: string;
  encoding: PayloadEncoding;
  bytes: number;
};

export type WebSocketActivityRecord = TransportActivityRecord<'websocket'>;

/**
 * One Socket.IO line. `event` is the name the payload travelled under, empty for
 * the status and error lines the app writes itself — no event produced those.
 * `ack` marks the answer to an emit that asked for one, so it reads as a reply
 * instead of as a second event that happens to share a name.
 */
export type SocketIoActivityRecord = TransportActivityRecord<'socketio'> & {
  event: string;
  ack: boolean;
};

/**
 * A union rather than an alias: every transport writes the same shared shape,
 * and the ones with more to say add their own fields instead of borrowing a
 * neighbour's. Readers of the common fields need no narrowing; the places that
 * build a record do, which is where the compiler wants the decision made.
 */
export type ActivityRecord = WebSocketActivityRecord | SocketIoActivityRecord;

/** The shared half, before a transport says which variant it is. */
export type CommonActivityRecord = Omit<WebSocketActivityRecord, 'transportKind'>;

/**
 * A resolved secret the export has to hide. The renderer holds the values —
 * they never reach disk — so it hands them over with the log they leaked into.
 */
export type ActivitySecret = { name: string; value: string };

export type ActivityExportRequest = {
  connectionName: string;
  records: ActivityRecord[];
  secrets: ActivitySecret[];
};

export type ConnectionStateEvent = {
  connectionId: string;
  state: ConnectionState;
  detail?: string;
};
