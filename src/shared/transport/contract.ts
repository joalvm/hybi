import type { TransportKind } from '../domain/connections/connection.js';
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

/** Forces factory maps to cover every transport kind. */
export type TransportFactoryMap<T> = Record<TransportKind, T>;
