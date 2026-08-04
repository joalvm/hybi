import type { WebSocketTransport } from './websocket.js';

/** Every persisted transport. Adding one extends this union and its schema. */
export type ConnectionTransport = WebSocketTransport;

export type TransportKind = ConnectionTransport['kind'];

/**
 * A map the compiler refuses until it covers every transport kind. This is the
 * project's forcing function for a new transport: a one-member union cannot be
 * narrowed — `no-unnecessary-condition` rejects the guard as always true — so
 * exhaustiveness is expressed as a total map rather than as a switch.
 */
export type TransportFactoryMap<T> = Record<TransportKind, T>;

/** Identity and environment stay stable when transport configuration changes. */
export type Connection = {
  id: string;
  name: string;
  environmentId: string | null;
  transport: ConnectionTransport;
};
