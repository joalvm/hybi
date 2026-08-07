import type { Socket } from 'socket.io-client';
import { format } from '@lang/translate.js';
import type {
  ResolvedSocketIoTransport,
  ResolvedTransport,
  TransportMessage,
} from '@shared/transport/contract.js';
import { mainMessages } from '../../lang.js';
import type { TransportSession, TransportSessionSink } from '../transport.js';
import { emitForAck } from './ack.js';
import { createSocketIoClient } from './client.js';
import { dial } from './dial.js';
import { outgoingArgument } from './frame.js';
import { listen } from './listen.js';
import { createSocketIoReporter } from './reporter.js';

/** One Socket.IO client behind the neutral transport port. */
export class SocketIoTransportSession implements TransportSession {
  readonly kind = 'socketio' as const;
  private socket: Socket | null = null;
  private target: ResolvedSocketIoTransport | null = null;
  private readonly reporter;
  private closedByUser = false;

  constructor(connectionId: string, sink: TransportSessionSink) {
    this.reporter = createSocketIoReporter(connectionId, sink);
  }

  async open(transport: ResolvedTransport): Promise<void> {
    // The port carries the union; an adapter only ever answers for its own
    // member of it. A mismatch is a wiring bug, not something a user can reach.
    if (transport.kind !== 'socketio') throw new Error(mainMessages().exceptions.transportMismatch);
    this.release();
    this.target = transport;
    this.closedByUser = false;

    let socket: Socket;
    try {
      socket = createSocketIoClient(transport);
    } catch (error) {
      this.reporter.failure(error, transport.url);
      throw error;
    }

    this.socket = socket;
    this.reporter.state('connecting');
    listen(socket, transport, this.reporter, { closedByUser: () => this.closedByUser });
    await dial(socket, transport);
  }

  /**
   * Nothing here is awaited: Socket.IO takes the argument into its own queue and
   * an emit without an ack has no completion to report. The port answers with a
   * promise all the same, so a refusal reaches the caller the way one does from
   * a transport that writes to a socket itself.
   */
  send(message: TransportMessage): Promise<number> {
    try {
      return Promise.resolve(this.emit(message));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  close(): void {
    this.closedByUser = true;
    const socket = this.socket;
    if (socket === null) {
      this.reporter.state('closed');
      return;
    }
    this.reporter.state('closing');
    socket.disconnect();
  }

  dispose(): void {
    this.closedByUser = true;
    this.target = null;
    this.release();
  }

  private emit(message: TransportMessage): number {
    const socket = this.socket;
    const target = this.target;
    const messages = mainMessages();
    if (message.kind !== 'socketio') throw new Error(messages.exceptions.transportMismatch);
    if (socket === null || !socket.connected || target === null) {
      throw new Error(messages.exceptions.connectionNotOpen);
    }

    const outgoing = outgoingArgument(message);
    if (!outgoing.ok) {
      throw new Error(
        outgoing.reason === 'base64'
          ? messages.validation.invalidBase64
          : messages.validation.invalidJsonArgument,
      );
    }
    // The ceiling is about what leaves the process, so it is measured on the
    // argument: base64 is a third larger than the bytes it carries.
    if (outgoing.frame.bytes > target.maxMessageBytes) {
      throw new Error(
        format(messages.validation.messageTooLarge, { bytes: target.maxMessageBytes }),
      );
    }

    const sequence = this.reporter.record('outgoing', message.event, outgoing.frame, {
      event: message.event,
    });
    if (message.ack) emitForAck(socket, target, message.event, outgoing.argument, this.reporter);
    else socket.emit(message.event, outgoing.argument);
    return sequence;
  }

  private release(): void {
    const socket = this.socket;
    this.socket = null;
    if (socket === null) return;
    socket.offAny();
    socket.removeAllListeners();
    socket.io.removeAllListeners();
    socket.disconnect();
  }
}
