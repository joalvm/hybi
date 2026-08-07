import type { ConnectionHeader, RetryPolicy } from './policies.js';

/** Re-exported from where they now live, so existing imports keep working. */
export type { ConnectionHeader, RetryPolicy } from './policies.js';

/** Native WebSocket ping/pong liveness policy. */
export type KeepalivePolicy = { enabled: boolean; intervalMs: number; timeoutMs: number };

/** Everything needed to configure one native WebSocket adapter. */
export type WebSocketTransportSettings = {
  headers: ConnectionHeader[];
  /** `Sec-WebSocket-Protocol`, in order of preference. */
  protocols: string[];
  retry: RetryPolicy;
  keepalive: KeepalivePolicy;
  /** `false` accepts any certificate and is only intended for controlled development. */
  verifyCertificate: boolean;
  /** Incoming and outgoing message ceiling in bytes. */
  maxMessageBytes: number;
};

/** Persisted WebSocket configuration. `url` may contain `{{variables}}`. */
export type WebSocketTransport = {
  kind: 'websocket';
  url: string;
  settings: WebSocketTransportSettings;
};
