import { io, type Socket } from 'socket.io-client';
import type { ResolvedSocketIoTransport } from '@shared/transport/contract.js';
import { assertHttpUrl } from './url.js';

/**
 * One configured client, not yet dialling. The namespace is taken from the
 * settings and appended to the origin rather than read out of the URL: they are
 * two different things a Socket.IO server is configured with — `path` is where
 * engine.io is mounted, the namespace is which room of the API is being joined —
 * and a URL that carried a path would otherwise silently mean one of them.
 *
 * Reconnection is Socket.IO's own, configured from the same retry policy the
 * native socket schedules by hand. Two implementations of backoff for one
 * setting is one more than the user asked for.
 */
export function createSocketIoClient(target: ResolvedSocketIoTransport): Socket {
  const url = assertHttpUrl(target.url);
  return io(`${url.origin}${target.namespace}`, {
    path: target.path,
    transports: target.transports,
    auth: target.auth,
    // Only the polling transport can carry these; the WebSocket upgrade drops
    // them, which is why the settings panel says so where they are typed.
    extraHeaders: target.headers,
    reconnection: target.retry.enabled,
    reconnectionAttempts: target.retry.attempts,
    reconnectionDelay: target.retry.baseMs,
    reconnectionDelayMax: target.retry.maxMs,
    rejectUnauthorized: target.verifyCertificate,
    // The session decides when to dial, so that its listeners are attached
    // before the first attempt can report anything.
    autoConnect: false,
    // A manager per session: sharing one would let a second connection to the
    // same origin inherit the first one's authentication and its lifetime.
    forceNew: true,
  });
}
