import type { Socket } from 'socket.io-client';
import type { ResolvedSocketIoTransport } from '@shared/transport/contract.js';
import { mainMessages } from '../../lang.js';
import { textFrame } from '../frame.js';
import { incomingFrame } from './frame.js';
import { ackTimeoutNote } from './notes.js';
import type { SocketIoReporter } from './reporter.js';

/**
 * An emit that asked a question, and the line its answer becomes. The caller is
 * not made to wait for it: the send is done once the argument is handed over,
 * and the reply is a record of its own whenever it arrives.
 *
 * A question that goes unanswered is an error rather than a status note — the
 * server was asked something and never replied, which is a result the user has
 * to be able to see.
 */
export function emitForAck(
  socket: Socket,
  target: ResolvedSocketIoTransport,
  event: string,
  argument: unknown,
  reporter: SocketIoReporter,
): void {
  socket
    .timeout(target.ackTimeoutMs)
    .emit(event, argument, (error: Error | null, ...answer: unknown[]) => {
      if (error !== null) {
        const note = ackTimeoutNote(event, target.ackTimeoutMs);
        reporter.record('error', mainMessages().activity.kinds.error, textFrame(note), {
          event,
          ack: true,
        });
        return;
      }
      reporter.record('incoming', event, incomingFrame(answer), { event, ack: true });
    });
}
