import type { ConnectionHeader, RetryPolicy } from './policies.js';

/** The engine.io transports the client may offer, in the order it offers them. */
export type SocketIoEngineTransport = 'polling' | 'websocket';

/** One member of the handshake `auth` object. Values may hold `{{variables}}`. */
export type SocketIoAuthEntry = { name: string; value: string; enabled: boolean };

/** Everything needed to configure one Socket.IO client. */
export type SocketIoTransportSettings = {
  /** Namespace to join. `/` is the default one every server exposes. */
  namespace: string;
  /** Where the server mounts engine.io — its own `path` option, not the namespace. */
  path: string;
  /** Sent once during the handshake as the `auth` payload the server reads. */
  auth: SocketIoAuthEntry[];
  /** Only the polling transport carries these; a WebSocket upgrade cannot. */
  headers: ConnectionHeader[];
  transports: SocketIoEngineTransport[];
  /** Socket.IO reconnects on its own, so this configures that rather than replacing it. */
  retry: RetryPolicy;
  /** How long an emit that asked for an ack waits before it is reported as timed out. */
  ackTimeoutMs: number;
  /** `false` accepts any certificate and is only intended for controlled development. */
  verifyCertificate: boolean;
  /** Outgoing argument ceiling in bytes. */
  maxMessageBytes: number;
};

/** Persisted Socket.IO configuration. `url` may contain `{{variables}}`. */
export type SocketIoTransport = {
  kind: 'socketio';
  url: string;
  settings: SocketIoTransportSettings;
};
