import type { ConnectionSettings } from '@shared/domain/types.js';
import type { SocketOptions } from '@shared/ipc/contract.js';
import { resolveText, type VariableScope } from '@shared/variables/resolve.js';

export type SocketOptionsResolution = { options: SocketOptions; missing: string[] };

/**
 * A connection's stored settings turned into what the socket needs, with every
 * `{{variable}}` in a header value already substituted.
 *
 * Resolution happens on this side rather than in the main process for the same
 * reason the URL's does: the scope carries the values of variables marked
 * secret, which are deliberately kept out of the workspace file, and nothing
 * crosses the bridge but the one header that asked for them.
 *
 * A row switched off is dropped rather than sent empty, and an unnamed row is
 * skipped — the editor keeps one while it is being typed.
 */
export function resolveSocketOptions(
  settings: ConnectionSettings,
  scope: VariableScope,
): SocketOptionsResolution {
  const missing = new Set<string>();
  const headers: Record<string, string> = {};

  for (const header of settings.headers) {
    if (!header.enabled || header.name === '') continue;
    const resolved = resolveText(header.value, scope);
    for (const name of resolved.missing) missing.add(name);
    headers[header.name] = stripBreaks(resolved.text);
  }

  return {
    options: {
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

/**
 * CR and LF end a header line, so a value carrying either would let whatever
 * follows be read as a header nobody wrote. The schema refuses one in a stored
 * value, but a variable can carry it in later — after substitution is the only
 * place that sees what actually goes on the wire.
 */
function stripBreaks(value: string): string {
  return value.replace(/[\r\n]/g, '');
}
