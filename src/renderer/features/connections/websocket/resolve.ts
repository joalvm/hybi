import type { WebSocketTransport } from '@shared/domain/connections/websocket.js';
import type { ResolvedWebSocketTransport } from '@shared/transport/websocket.js';
import { resolveText, type VariableScope } from '@shared/variables/resolve.js';

export type WebSocketTransportResolution = {
  transport: ResolvedWebSocketTransport;
  missing: string[];
};

/** Resolves persisted templates into the runtime contract crossing IPC. */
export function resolveWebSocketTransport(
  transport: WebSocketTransport,
  scope: VariableScope,
): WebSocketTransportResolution {
  const missing = new Set<string>();
  const url = resolveText(transport.url, scope);
  for (const name of url.missing) missing.add(name);

  const headers: Record<string, string> = {};
  for (const header of transport.settings.headers) {
    if (!header.enabled || header.name === '') continue;
    const resolved = resolveText(header.value, scope);
    for (const name of resolved.missing) missing.add(name);
    headers[header.name] = resolved.text.replace(/[\r\n]/g, '');
  }

  const { settings } = transport;
  return {
    transport: {
      kind: 'websocket',
      url: url.text,
      headers,
      protocols: [...settings.protocols],
      retry: { ...settings.retry },
      keepalive: { ...settings.keepalive },
      verifyCertificate: settings.verifyCertificate,
      maxMessageBytes: settings.maxMessageBytes,
    },
    missing: [...missing],
  };
}
