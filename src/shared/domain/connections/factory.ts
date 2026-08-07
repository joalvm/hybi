import {
  cloneConnectionTransport,
  cloneSocketIoSettings,
  cloneWebSocketSettings,
} from './defaults.js';
import type {
  Connection,
  ConnectionTransport,
  TransportFactoryMap,
  TransportKind,
} from './connection.js';
import type { SocketIoTransport, SocketIoTransportSettings } from './socketio.js';
import type { WebSocketTransport, WebSocketTransportSettings } from './websocket.js';

function newId(): string {
  return globalThis.crypto.randomUUID();
}

export function createWebSocketTransport(input: {
  url?: string;
  settings?: WebSocketTransportSettings;
} = {}): WebSocketTransport {
  return {
    kind: 'websocket',
    url: input.url ?? 'ws://127.0.0.1:3000',
    settings: cloneWebSocketSettings(input.settings),
  };
}

export function createSocketIoTransport(input: {
  url?: string;
  settings?: SocketIoTransportSettings;
} = {}): SocketIoTransport {
  return {
    kind: 'socketio',
    url: input.url ?? 'http://127.0.0.1:3000',
    settings: cloneSocketIoSettings(input.settings),
  };
}

const TRANSPORT_FACTORIES: TransportFactoryMap<() => ConnectionTransport> = {
  websocket: () => createWebSocketTransport(),
  socketio: () => createSocketIoTransport(),
};

/**
 * A transport of the requested kind, at its own defaults. Nothing is carried
 * over from the one being replaced: the settings do not mean the same thing on
 * both sides, and neither does the URL — a half-migrated configuration looks
 * configured and is not.
 */
export function createTransport(kind: TransportKind): ConnectionTransport {
  return TRANSPORT_FACTORIES[kind]();
}

export function createConnection(input: {
  name: string;
  environmentId?: string | null;
  transport?: ConnectionTransport;
}): Connection {
  return {
    id: newId(),
    name: input.name,
    environmentId: input.environmentId ?? null,
    transport:
      input.transport === undefined
        ? createWebSocketTransport()
        : cloneConnectionTransport(input.transport),
  };
}

/** A copy owns its complete transport configuration. */
export function duplicateConnection(source: Connection, name: string): Connection {
  return {
    ...source,
    id: newId(),
    name,
    transport: cloneConnectionTransport(source.transport),
  };
}
