import type { WebSocketTransport } from './websocket.js';

/** Every persisted transport. Adding one extends this union and its schema. */
export type ConnectionTransport = WebSocketTransport;

export type TransportKind = ConnectionTransport['kind'];

/** Identity and environment stay stable when transport configuration changes. */
export type Connection = {
  id: string;
  name: string;
  environmentId: string | null;
  transport: ConnectionTransport;
};
