import type { Socket } from 'socket.io-client';
import { format } from '@lang/translate.js';
import type { ResolvedSocketIoTransport } from '@shared/transport/contract.js';
import { mainMessages } from '../../lang.js';

/**
 * Connects, and answers when the attempt has settled rather than when the first
 * packet fails. A refusal only ends it when Socket.IO has given up too: with
 * reconnection on, the first failure is one of several tries, and the caller is
 * waiting for the outcome of all of them.
 *
 * `active` is Socket.IO saying whether it means to try again — false for a
 * rejected handshake, which is the server answering rather than the network.
 */
export async function dial(socket: Socket, target: ResolvedSocketIoTransport): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const settle = (error: Error | null): void => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      socket.io.off('reconnect_failed', onExhausted);
      if (error === null) resolve();
      else reject(error);
    };
    const onConnect = (): void => {
      settle(null);
    };
    const onError = (error: Error): void => {
      if (!socket.active) settle(error);
    };
    const onExhausted = (): void => {
      settle(new Error(format(mainMessages().exceptions.reconnectFailed, { url: target.url })));
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onError);
    socket.io.on('reconnect_failed', onExhausted);
    socket.connect();
  });
}
