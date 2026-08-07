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
 * How `body` becomes the value that is emitted. A WebSocket frame is bytes
 * either way, so there `encoding` answers the whole question; here the same
 * text can be a string or the object it spells, and the two reach the server as
 * different arguments. It is declared rather than inferred: parsing whatever
 * happens to look like JSON would send an object where a string was typed.
 */
export type SocketIoArgument = 'json' | 'text' | 'binary';

/**
 * One `emit`. The event is its own field rather than something parsed out of
 * the body, because Socket.IO routes on the name and the payload is the
 * argument: putting them in the same string would mean guessing where one ends.
 *
 * `body` carries exactly one argument — the text as written, or base64 when
 * `argument` is `binary`, which the adapter emits as a `Buffer` and Socket.IO
 * carries as a binary attachment. `ack` asks the server to answer; the answer
 * becomes its own line in the activity log.
 */
export type SocketIoTransportMessage = {
  kind: 'socketio';
  event: string;
  body: string;
  argument: SocketIoArgument;
  ack: boolean;
};
