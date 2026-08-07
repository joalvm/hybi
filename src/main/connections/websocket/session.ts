import { WebSocket } from 'ws';
import type {
  ResolvedTransport,
  ResolvedWebSocketTransport,
  TransportMessage,
} from '@shared/transport/contract.js';
import { mainMessages } from '../../lang.js';
import type { TransportSession, TransportSessionSink } from '../transport.js';
import { createWebSocketAttempt, disposeWebSocketAttempt, type WebSocketAttempt } from './attempt.js';
import { frameOf, textFrame } from './frame.js';
import { labelFor } from './label.js';
import { closedNote, retryNote } from './notes.js';
import { createWebSocketReporter } from './reporter.js';
import { RetryScheduler } from './retry.js';
import { outgoingFor, writeFrame } from './send.js';
import { assertWsUrl } from './url.js';

/** One native WebSocket state machine behind the neutral transport port. */
export class WebSocketTransportSession implements TransportSession {
  readonly kind = 'websocket' as const;
  private active: WebSocketAttempt | null = null;
  private target: ResolvedWebSocketTransport | null = null;
  private readonly retry = new RetryScheduler();
  private readonly reporter;
  private wasOpen = false;
  private closedByUser = false;

  constructor(connectionId: string, sink: TransportSessionSink) {
    this.reporter = createWebSocketReporter(connectionId, sink);
  }

  async open(transport: ResolvedTransport): Promise<void> {
    // The port carries the union; an adapter only ever answers for its own
    // member of it. A mismatch is a wiring bug, not something a user can reach.
    if (transport.kind !== 'websocket') throw new Error(mainMessages().exceptions.transportMismatch);
    this.releaseActive();
    this.target = transport;
    this.retry.cancel();
    this.retry.reset();
    this.wasOpen = false;
    this.closedByUser = false;
    await this.connect();
  }

  async send(message: TransportMessage): Promise<number> {
    const attempt = this.active;
    const target = this.target;
    const messages = mainMessages();
    if (message.kind !== 'websocket') throw new Error(messages.exceptions.transportMismatch);
    if (attempt?.socket.readyState !== WebSocket.OPEN || target === null) {
      throw new Error(messages.exceptions.connectionNotOpen);
    }

    const outgoing = outgoingFor(message, target.maxMessageBytes);
    await writeFrame(attempt.socket, outgoing.payload, messages.exceptions.sendFailed);
    return this.reporter.record('outgoing', labelFor(outgoing.frame), outgoing.frame);
  }

  close(): void {
    this.closedByUser = true;
    this.retry.cancel();
    const attempt = this.active;
    if (attempt === null) {
      this.reporter.state('closed');
      return;
    }
    attempt.stopKeepalive?.();
    attempt.stopKeepalive = null;
    this.reporter.state('closing');
    attempt.socket.close();
  }

  dispose(): void {
    this.closedByUser = true;
    this.target = null;
    this.retry.cancel();
    this.releaseActive();
  }

  private async connect(): Promise<void> {
    const target = this.target;
    if (target === null) return;

    let parsed: URL;
    try {
      parsed = assertWsUrl(target.url);
    } catch (error) {
      this.reporter.failure(error, target.url);
      throw error;
    }

    this.reporter.state('connecting');
    const started = createWebSocketAttempt(parsed, target, {
      isCurrent: (attempt) => this.active === attempt,
      open: () => {
        this.wasOpen = true;
        this.retry.reset();
        this.reporter.state('open');
      },
      message: (attempt, data, isBinary) => {
        if (this.active !== attempt) return;
        const frame = frameOf(data, isBinary);
        this.reporter.record('incoming', labelFor(frame), frame);
      },
      error: (attempt, error) => {
        if (this.active === attempt) this.reporter.failure(error, target.url);
      },
      close: (attempt, code, reason) => {
        this.handleClose(attempt, code, reason);
      },
    });
    this.active = started.attempt;
    await started.opened;
  }

  private handleClose(attempt: WebSocketAttempt, code: number, reason: string): void {
    attempt.stopKeepalive?.();
    attempt.stopKeepalive = null;
    if (this.active !== attempt) return;
    this.active = null;
    const dropped = !this.closedByUser && this.wasOpen;
    this.reporter.record('status', closedNote(code), textFrame(reason));
    this.reporter.state(dropped ? 'dropped' : 'closed', String(code));
    if (dropped) this.scheduleRetry();
  }

  private scheduleRetry(): void {
    const target = this.target;
    if (target === null) return;
    const delay = this.retry.schedule(target.retry, () => {
      this.connect().catch((error: unknown) => {
        this.reporter.failure(error, target.url);
        this.scheduleRetry();
      });
    });
    if (delay === null) return;
    const note = retryNote(this.retry.attempts, target.retry.attempts, delay);
    this.reporter.record('status', note.label, textFrame(note.body));
  }

  private releaseActive(): void {
    const attempt = this.active;
    this.active = null;
    if (attempt === null) return;
    disposeWebSocketAttempt(attempt);
  }
}
