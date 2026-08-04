import type { ConnectionTransport, TransportFactoryMap } from './connection.js';
import type { WebSocketTransport, WebSocketTransportSettings } from './websocket.js';

/** Native WebSocket behavior used for new and migrated connections. */
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
