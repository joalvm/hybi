import { WebSocket } from 'ws';
import { format } from '@lang/translate.js';
import type { ResolvedTransport, TransportMessage } from '@shared/transport/contract.js';
import { mainMessages } from '../../lang.js';
import type { TransportSession, TransportSessionSink } from '../transport.js';
import { createWebSocketAttempt, disposeWebSocketAttempt, type WebSocketAttempt } from './attempt.js';
import { bodyOf } from './frame.js';
import { labelOf } from './label.js';
import { createWebSocketReporter, errorMessage } from './reporter.js';
import { RetryScheduler } from './retry.js';
import { assertWsUrl } from './url.js';

/** One native WebSocket state machine behind the neutral transport port. */
export class WebSocketTransportSession implements TransportSession {
  readonly kind = 'websocket' as const;
  private active: WebSocketAttempt | null = null;
  private target: ResolvedTransport | null = null;
  private readonly retry = new RetryScheduler();
  private readonly reporter;
  private wasOpen = false;
  private closedByUser = false;

  constructor(connectionId: string, sink: TransportSessionSink) {
    this.reporter = createWebSocketReporter(connectionId, sink);
  }

  async open(transport: ResolvedTransport): Promise<void> {
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
    if (attempt?.socket.readyState !== WebSocket.OPEN || target === null) {
      throw new Error(messages.exceptions.connectionNotOpen);
    }
    const bytes = Buffer.byteLength(message.text, 'utf8');
    if (bytes > target.maxMessageBytes) {
      throw new Error(
        format(messages.validation.messageTooLarge, { bytes: target.maxMessageBytes }),
      );
    }

    await new Promise<void>((resolve, reject) => {
      attempt.socket.send(message.text, (error) => {
        const cause: unknown = error;
        if (cause === undefined || cause === null) resolve();
        else reject(cause instanceof Error ? cause : new Error(messages.exceptions.sendFailed));
      });
    });
    return this.reporter.record('outgoing', labelOf(message.text), message.text);
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
      this.reporter.record('error', 'Error', errorMessage(error));
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
        const body = bodyOf(data, isBinary);
        this.reporter.record('incoming', labelOf(body), body);
      },
      error: (attempt, error) => {
        if (this.active === attempt) this.reporter.record('error', 'Error', error.message);
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
    this.reporter.record('status', `Cerrado (${String(code)})`, reason);
    this.reporter.state(dropped ? 'dropped' : 'closed', String(code));
    if (dropped) this.scheduleRetry();
  }

  private scheduleRetry(): void {
    const target = this.target;
    if (target === null) return;
    const delay = this.retry.schedule(target.retry, () => {
      this.connect().catch((error: unknown) => {
        this.reporter.record('error', 'Error', errorMessage(error));
        this.scheduleRetry();
      });
    });
    if (delay === null) return;
    this.reporter.record(
      'status',
      `Reintentando (${String(this.retry.attempts)}/${String(target.retry.attempts)})`,
      `en ${String(delay)} ms`,
    );
  }

  private releaseActive(): void {
    const attempt = this.active;
    this.active = null;
    if (attempt === null) return;
    disposeWebSocketAttempt(attempt);
  }
}
