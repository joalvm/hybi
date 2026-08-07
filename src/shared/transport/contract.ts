import type {
  ResolvedSocketIoTransport,
  SocketIoTransportMessage,
} from './socketio.js';
import type {
  ResolvedWebSocketTransport,
  WebSocketTransportMessage,
} from './websocket.js';

export type ResolvedTransport = ResolvedWebSocketTransport | ResolvedSocketIoTransport;
export type TransportMessage = WebSocketTransportMessage | SocketIoTransportMessage;

export type { ResolvedWebSocketTransport, WebSocketTransportMessage } from './websocket.js';
export type {
  ResolvedSocketIoTransport,
  SocketIoArgument,
  SocketIoTransportMessage,
} from './socketio.js';

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
