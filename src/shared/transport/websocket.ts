import type { PayloadEncoding } from '../binary/encoding.js';
import type {
  KeepalivePolicy,
  RetryPolicy,
} from '../domain/connections/websocket.js';

/** Resolved values ready to cross IPC and open a native WebSocket. */
export type ResolvedWebSocketTransport = {
  kind: 'websocket';
  url: string;
  headers: Record<string, string>;
  protocols: string[];
  retry: RetryPolicy;
  keepalive: KeepalivePolicy;
  verifyCertificate: boolean;
  maxMessageBytes: number;
};

/**
 * What the composer asks the socket to send. `encoding` is part of the command
 * rather than something the main process infers: a binary payload crosses as
 * base64, and guessing how to read the body puts different bytes on the wire
 * than the ones that were asked for.
 */
export type WebSocketTransportMessage = {
  kind: 'websocket';
  body: string;
  encoding: PayloadEncoding;
};
