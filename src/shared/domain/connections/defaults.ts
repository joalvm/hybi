import type { ConnectionTransport, TransportFactoryMap } from './connection.js';
import type { SocketIoTransportSettings } from './socketio.js';
import type { WebSocketTransport, WebSocketTransportSettings } from './websocket.js';

/** Native WebSocket behavior every new connection starts from. */
export const DEFAULT_WEBSOCKET_SETTINGS: WebSocketTransportSettings = {
  headers: [],
  protocols: [],
  retry: { enabled: true, attempts: 5, baseMs: 500, maxMs: 8000 },
  keepalive: { enabled: false, intervalMs: 30000, timeoutMs: 10000 },
  verifyCertificate: true,
  maxMessageBytes: 104857600,
};

/** A settings copy owns every mutable nested value. */
export function cloneWebSocketSettings(
  settings: WebSocketTransportSettings = DEFAULT_WEBSOCKET_SETTINGS,
): WebSocketTransportSettings {
  return {
    headers: settings.headers.map((header) => ({ ...header })),
    protocols: [...settings.protocols],
    retry: { ...settings.retry },
    keepalive: { ...settings.keepalive },
    verifyCertificate: settings.verifyCertificate,
    maxMessageBytes: settings.maxMessageBytes,
  };
}

/**
 * Socket.IO behavior every new connection starts from. Only the WebSocket
 * engine transport is offered: polling exists for browsers behind proxies that
 * refuse the upgrade, and this app is not a browser. It stays configurable
 * because the server on the other side may be the one that refuses.
 */
export const DEFAULT_SOCKETIO_SETTINGS: SocketIoTransportSettings = {
  namespace: '/',
  path: '/socket.io',
  auth: [],
  headers: [],
  transports: ['websocket'],
  retry: { enabled: true, attempts: 5, baseMs: 500, maxMs: 8000 },
  ackTimeoutMs: 10000,
  verifyCertificate: true,
  maxMessageBytes: 104857600,
};

/** A settings copy owns every mutable nested value. */
export function cloneSocketIoSettings(
  settings: SocketIoTransportSettings = DEFAULT_SOCKETIO_SETTINGS,
): SocketIoTransportSettings {
  return {
    namespace: settings.namespace,
    path: settings.path,
    auth: settings.auth.map((entry) => ({ ...entry })),
    headers: settings.headers.map((header) => ({ ...header })),
    transports: [...settings.transports],
    retry: { ...settings.retry },
    ackTimeoutMs: settings.ackTimeoutMs,
    verifyCertificate: settings.verifyCertificate,
    maxMessageBytes: settings.maxMessageBytes,
  };
}

/**
 * One cloner per transport kind. A map rather than a body that reads
 * `transport.settings`: the old version wrote `kind: 'websocket'` into whatever
 * it was handed, so the first transport to arrive beside WebSocket would have
 * been silently relabelled every time a connection was duplicated. The compiler
 * refuses this object until every kind in the union has an entry.
 */
const CLONERS: TransportFactoryMap<(transport: never) => ConnectionTransport> = {
  websocket: (transport: WebSocketTransport) => ({
    kind: 'websocket',
    url: transport.url,
    settings: cloneWebSocketSettings(transport.settings),
  }),
};

/** A transport copy owns every nested object and array it can mutate. */
export function cloneConnectionTransport(transport: ConnectionTransport): ConnectionTransport {
  return CLONERS[transport.kind](transport as never);
}
