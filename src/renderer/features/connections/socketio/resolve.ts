import type { SocketIoTransport } from '@shared/domain/connections/socketio.js';
import type { ResolvedSocketIoTransport } from '@shared/transport/socketio.js';
import { resolveText, type VariableScope } from '@shared/variables/resolve.js';

export type SocketIoTransportResolution = {
  transport: ResolvedSocketIoTransport;
  missing: string[];
};

/** Resolves persisted templates into the runtime contract crossing IPC. */
export function resolveSocketIoTransport(
  transport: SocketIoTransport,
  scope: VariableScope,
): SocketIoTransportResolution {
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

  // The handshake payload is JSON, not a header, so a line break in a value is
  // a character like any other and is left where the user put it.
  const auth: Record<string, string> = {};
  for (const entry of transport.settings.auth) {
    if (!entry.enabled || entry.name === '') continue;
    const resolved = resolveText(entry.value, scope);
    for (const name of resolved.missing) missing.add(name);
    auth[entry.name] = resolved.text;
  }

  const { settings } = transport;
  return {
    transport: {
      kind: 'socketio',
      url: url.text,
      namespace: settings.namespace,
      path: settings.path,
      auth,
      headers,
      transports: [...settings.transports],
      retry: { ...settings.retry },
      ackTimeoutMs: settings.ackTimeoutMs,
      verifyCertificate: settings.verifyCertificate,
      maxMessageBytes: settings.maxMessageBytes,
    },
    missing: [...missing],
  };
}
