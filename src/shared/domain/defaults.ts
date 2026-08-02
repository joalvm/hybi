import type { ConnectionSettings } from './types.js';

/**
 * What a connection is opened with when nobody has said otherwise, and what a
 * v2 document is filled with on migration — so upgrading changes a file without
 * changing how any of its connections behave.
 *
 * `verifyCertificate` starts on. `keepalive` starts off: a peer that never
 * answers a ping would otherwise be terminated by an upgrade the user did not
 * ask for. `maxMessageBytes` is the `ws` default (100 MiB), for the same reason.
 */
export const DEFAULT_CONNECTION_SETTINGS: ConnectionSettings = {
  headers: [],
  protocols: [],
  retry: { enabled: true, attempts: 5, baseMs: 500, maxMs: 8000 },
  keepalive: { enabled: false, intervalMs: 30000, timeoutMs: 10000 },
  verifyCertificate: true,
  maxMessageBytes: 104857600,
};

/**
 * An owned copy, down to the arrays. Two connections seeded from the same
 * object would otherwise share one header list, and editing either would edit
 * both — the same trap a duplicated workspace falls into with a shallow spread.
 */
export function cloneConnectionSettings(
  settings: ConnectionSettings = DEFAULT_CONNECTION_SETTINGS,
): ConnectionSettings {
  return {
    headers: settings.headers.map((header) => ({ ...header })),
    protocols: [...settings.protocols],
    retry: { ...settings.retry },
    keepalive: { ...settings.keepalive },
    verifyCertificate: settings.verifyCertificate,
    maxMessageBytes: settings.maxMessageBytes,
  };
}
