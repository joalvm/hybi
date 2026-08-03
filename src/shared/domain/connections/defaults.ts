import type { ConnectionTransport } from './connection.js';
import type { WebSocketTransportSettings } from './websocket.js';

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

/** A transport copy owns every nested object and array it can mutate. */
export function cloneConnectionTransport(transport: ConnectionTransport): ConnectionTransport {
  return {
    kind: 'websocket',
    url: transport.url,
    settings: cloneWebSocketSettings(transport.settings),
  };
}
