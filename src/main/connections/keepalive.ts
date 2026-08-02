import type { WebSocket } from 'ws';
import type { KeepalivePolicy } from '@shared/domain/types.js';

/**
 * Protocol-level liveness for one socket. A connection cut by a proxy or a NAT
 * table announces nothing, so without this the session sits in `open` while the
 * wire is already gone and every send lands nowhere.
 *
 * Lives outside `session.ts`, which is over the file budget already, and takes
 * the socket rather than the session: it needs a ping, a pong and a way to give
 * up, and nothing else about the connection.
 *
 * Returns the stop function — the caller owns the socket's lifetime.
 */
export function startKeepalive(socket: WebSocket, policy: KeepalivePolicy): () => void {
  if (!policy.enabled) return () => undefined;

  let deadline: NodeJS.Timeout | null = null;

  const clearDeadline = (): void => {
    if (deadline !== null) clearTimeout(deadline);
    deadline = null;
  };

  const interval = setInterval(() => {
    // A deadline still pending means the last ping was never answered. Sending
    // another would only stack timers: the one already running is what decides.
    if (deadline !== null) return;

    socket.ping();
    deadline = setTimeout(() => {
      deadline = null;
      // `terminate`, not `close`: a peer that stopped answering pings will not
      // answer a close handshake either, and the session would hang waiting.
      socket.terminate();
    }, policy.timeoutMs);
  }, policy.intervalMs);

  socket.on('pong', clearDeadline);

  return () => {
    clearInterval(interval);
    clearDeadline();
  };
}
