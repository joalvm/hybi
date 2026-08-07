import type { WebSocket } from 'ws';

/**
 * One frame written to the socket, as a promise. `ws` reports a write failure
 * through a callback and sometimes with nothing in it at all, so the absence of
 * an error is what resolves and anything else becomes a rejection the caller
 * can report.
 */
export async function writeFrame(
  socket: WebSocket,
  payload: string | Buffer,
  failure: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    socket.send(payload, (error) => {
      const cause: unknown = error;
      if (cause === undefined || cause === null) resolve();
      else reject(cause instanceof Error ? cause : new Error(failure));
    });
  });
}
