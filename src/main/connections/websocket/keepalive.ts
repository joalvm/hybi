import type { WebSocket } from 'ws';
import type { KeepalivePolicy } from '@shared/domain/types.js';

/** Protocol ping/pong lifetime tied to exactly one open WebSocket. */
export function startKeepalive(socket: WebSocket, policy: KeepalivePolicy): () => void {
  if (!policy.enabled) return () => undefined;
  let deadline: NodeJS.Timeout | null = null;

  const clearDeadline = (): void => {
    if (deadline !== null) clearTimeout(deadline);
    deadline = null;
  };
  const interval = setInterval(() => {
    if (deadline !== null) return;
    socket.ping();
    deadline = setTimeout(() => {
      deadline = null;
      socket.terminate();
    }, policy.timeoutMs);
  }, policy.intervalMs);
  socket.on('pong', clearDeadline);

  return () => {
    clearInterval(interval);
    clearDeadline();
    socket.off('pong', clearDeadline);
  };
}
