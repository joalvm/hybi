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
export type ActivityRecord = WebSocketActivityRecord;

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
