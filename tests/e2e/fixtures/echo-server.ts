import type { AddressInfo } from 'node:net';
import { WebSocketServer } from 'ws';

/** Port 0 so parallel runs never fight over a fixed port. */
export async function startEchoServer(): Promise<{ url: string; close: () => Promise<void> }> {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await new Promise((resolve) => server.once('listening', resolve));
  server.on('connection', (socket) => {
    socket.on('message', (data: Buffer) => {
      socket.send(`echo:${data.toString()}`);
    });
  });
  const { port } = server.address() as AddressInfo;
  return {
    url: `ws://127.0.0.1:${String(port)}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      }),
  };
}
