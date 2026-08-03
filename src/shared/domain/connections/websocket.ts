/** One WebSocket handshake header. Secret values stay in referenced variables. */
export type ConnectionHeader = { name: string; value: string; enabled: boolean };

/** Reconnection after a peer drops a connection that had reached `open`. */
export type RetryPolicy = { enabled: boolean; attempts: number; baseMs: number; maxMs: number };

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
