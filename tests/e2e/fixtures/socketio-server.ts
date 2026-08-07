import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';

/**
 * A real Socket.IO server on a namespace of its own, so the E2E run proves the
 * handshake, the namespace and the ack against the library the app will meet —
 * not against a stand-in that agrees with whatever the client sends.
 *
 * Port 0 so parallel runs never fight over a fixed port.
 */
export async function startSocketIoServer(
  namespace = '/chat',
): Promise<{ url: string; namespace: string; close: () => Promise<void> }> {
  const http = createServer();
  const io = new Server(http, { path: '/socket.io' });

  io.of(namespace).on('connection', (socket) => {
    socket.onAny((event: string, payload: unknown, ack?: (answer: unknown) => void) => {
      // Answers when asked, and echoes under a name of its own either way, so a
      // test can tell the ack apart from the event that came back.
      if (typeof ack === 'function') ack({ ack: true, event });
      socket.emit('echo', { event, payload });
    });
  });

  await new Promise<void>((resolve) => {
    http.listen(0, '127.0.0.1', resolve);
  });
  const { port } = http.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${String(port)}`,
    namespace,
    close: async () => {
      io.disconnectSockets(true);
      await io.close();
    },
  };
}
