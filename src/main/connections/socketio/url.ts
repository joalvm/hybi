import { format } from '@lang/translate.js';
import { mainMessages } from '../../lang.js';

/**
 * What a user pastes when they mean the same server. Socket.IO speaks HTTP and
 * upgrades afterwards, but the address printed in a server's own logs is often
 * the socket one, and refusing it would be a spelling test rather than a check.
 */
const REWRITES: Record<string, string> = { 'ws:': 'http:', 'wss:': 'https:' };

const ALLOWED = new Set(['http:', 'https:']);

/** The single gate between untrusted renderer input and a Socket.IO client. */
export function assertHttpUrl(value: string): URL {
  const url = new URL(value);
  const rewritten = REWRITES[url.protocol];
  if (rewritten !== undefined) url.protocol = rewritten;
  if (!ALLOWED.has(url.protocol)) {
    throw new Error(
      format(mainMessages().validation.unsupportedHttpScheme, { protocol: url.protocol }),
    );
  }
  return url;
}
