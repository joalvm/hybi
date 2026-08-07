import type { TransportKind } from '@shared/domain/types.js';
import type { ActivityRecord, ConnectionState } from '@shared/ipc/activity.js';
import type {
  ResolvedTransport,
  TransportFactoryMap,
  TransportMessage,
} from '@shared/transport/contract.js';
import { SocketIoTransportSession } from './socketio/session.js';
import { WebSocketTransportSession } from './websocket/session.js';

export type TransportSessionSink = {
  state(state: ConnectionState, detail?: string): void;
  activity(record: ActivityRecord): void;
};

/** Main-process port implemented by every concrete transport adapter. */
export type TransportSession = {
  readonly kind: TransportKind;
  open(transport: ResolvedTransport): Promise<void>;
  send(message: TransportMessage): Promise<number>;
  close(): void;
  dispose(): void;
};

export type TransportSessionFactory = (
  kind: TransportKind,
  connectionId: string,
  sink: TransportSessionSink,
) => TransportSession;

type AdapterFactory = (connectionId: string, sink: TransportSessionSink) => TransportSession;

const ADAPTER_FACTORIES = {
  websocket: (connectionId, sink) => new WebSocketTransportSession(connectionId, sink),
  socketio: (connectionId, sink) => new SocketIoTransportSession(connectionId, sink),
} satisfies TransportFactoryMap<AdapterFactory>;

/** Compile-time exhaustive composition root for transport adapters. */
export const createTransportSession: TransportSessionFactory = (kind, connectionId, sink) =>
  ADAPTER_FACTORIES[kind](connectionId, sink);
