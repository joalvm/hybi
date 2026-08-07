import type { WebSocket } from 'ws';
import { format } from '@lang/translate.js';
import type { WebSocketTransportMessage } from '@shared/transport/contract.js';
import { mainMessages } from '../../lang.js';
import type { Frame } from '../frame.js';
import { outgoingFrame } from './frame.js';

/**
 * What a send command is allowed to put on the socket. The ceiling is about the
 * wire, and base64 is a third larger than what it carries: measuring the string
 * would refuse frames that fit.
 */
export function outgoingFor(
  message: WebSocketTransportMessage,
  maxMessageBytes: number,
): { payload: string | Buffer; frame: Frame } {
  const messages = mainMessages();
  const outgoing = outgoingFrame(message);
  if (outgoing === null) throw new Error(messages.validation.invalidBase64);
  if (outgoing.frame.bytes > maxMessageBytes) {
    throw new Error(format(messages.validation.messageTooLarge, { bytes: maxMessageBytes }));
  }
  return outgoing;
}

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
