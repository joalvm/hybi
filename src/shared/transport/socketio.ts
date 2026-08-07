import type { PayloadEncoding } from '../binary/encoding.js';
import type { RetryPolicy } from '../domain/connections/policies.js';
import type { SocketIoEngineTransport } from '../domain/connections/socketio.js';

/** Resolved values ready to cross IPC and open a Socket.IO client. */
export type ResolvedSocketIoTransport = {
  kind: 'socketio';
  url: string;
  namespace: string;
  path: string;
  auth: Record<string, string>;
  headers: Record<string, string>;
  transports: SocketIoEngineTransport[];
  retry: RetryPolicy;
  ackTimeoutMs: number;
  verifyCertificate: boolean;
  maxMessageBytes: number;
};

/**
 * One `emit`. The event is its own field rather than something parsed out of
 * the body, because Socket.IO routes on the name and the payload is the
 * argument: putting them in the same string would mean guessing where one ends.
 *
 * `body` is a single argument, read through `encoding` — text as written, or
 * base64 for bytes, which the adapter emits as a `Buffer` and Socket.IO carries
 * as a binary attachment. `ack` asks the server to answer; the answer becomes
 * its own line in the activity log.
 */
export type SocketIoTransportMessage = {
  kind: 'socketio';
  event: string;
  body: string;
  encoding: PayloadEncoding;
  ack: boolean;
};
