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

export type WebSocketTransportMessage = { kind: 'websocket'; text: string };
