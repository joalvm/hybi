import type {
  ResolvedWebSocketTransport,
  WebSocketTransportMessage,
} from './websocket.js';

export type ResolvedTransport = ResolvedWebSocketTransport;
export type TransportMessage = WebSocketTransportMessage;

export type { ResolvedWebSocketTransport, WebSocketTransportMessage } from './websocket.js';

export type OpenConnectionRequest = {
  connectionId: string;
  transport: ResolvedTransport;
};

export type SendConnectionRequest = {
  connectionId: string;
  message: TransportMessage;
};

export type CloseConnectionRequest = { connectionId: string };

export type TransportSendResult = { sequence: number };

/** Declared with `TransportKind` itself, and re-exported here for the adapters. */
export type { TransportFactoryMap } from '../domain/connections/connection.js';
