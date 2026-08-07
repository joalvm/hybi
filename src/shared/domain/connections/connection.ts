import type { SocketIoTransport } from './socketio.js';
import type { WebSocketTransport } from './websocket.js';

/** Every persisted transport. Adding one extends this union and its schema. */
export type ConnectionTransport = WebSocketTransport | SocketIoTransport;

export type TransportKind = ConnectionTransport['kind'];

/**
 * A map the compiler refuses until it covers every transport kind. This is the
 * project's forcing function for a new transport: it is what turned adding
 * Socket.IO into a list of compiler errors, one per place that had to decide
 * something, rather than into a search for the places that had been missed.
 */
export type TransportFactoryMap<T> = Record<TransportKind, T>;

/** Identity and environment stay stable when transport configuration changes. */
export type Connection = {
  id: string;
  name: string;
  environmentId: string | null;
  transport: ConnectionTransport;
};
