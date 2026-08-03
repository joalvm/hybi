import { cloneConnectionTransport, cloneWebSocketSettings } from './defaults.js';
import type { Connection, ConnectionTransport } from './connection.js';
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
