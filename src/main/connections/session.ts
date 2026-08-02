import { WebSocket, type RawData } from 'ws';
import type { ActivityKind, ActivityRecord, ConnectionState } from '@shared/ipc/activity.js';
import type { SocketOptions } from '@shared/ipc/contract.js';
import { bodyOf } from './frame.js';
import { startKeepalive } from './keepalive.js';
import { labelOf } from './label.js';
import { RetryScheduler } from './retry.js';
import { assertWsUrl } from './url.js';

export type RetryOptions = { baseMs: number; maxMs: number; attempts: number };

export type SessionSink = {
  state(state: ConnectionState, detail?: string): void;
  activity(record: ActivityRecord): void;
};

type Target = { url: string; options: SocketOptions };

/**
 * One socket and its state machine. Reconnection only kicks in after a
 * connection that had reached `open` is dropped by the peer — a failed first
 * attempt is reported to the caller instead, and a manual close is final.
 */
export class WsSession {
  private socket: WebSocket | null = null;
  private target: Target | null = null;
  private stopKeepalive: (() => void) | null = null;
  private readonly retry = new RetryScheduler();
  private state: ConnectionState = 'idle';
  private sequence = 0;
  private wasOpen = false;
  private closedByUser = false;

  constructor(
    private readonly connectionId: string,
    private readonly sink: SessionSink,
  ) {}

  /**
   * Options belong to the attempt, not to the session: they are the connection's
   * settings as they stood when connect was pressed, so editing them and
   * reconnecting is what applies them — a live socket keeps the ones it opened
   * with, which is also what the settings dialog says.
   */
  async open(url: string, options: SocketOptions): Promise<void> {
    this.close();
    this.target = { url, options };
    this.retry.reset();
    this.wasOpen = false;
    this.closedByUser = false;
    await this.connect();
  }

  send(text: string): number {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      throw new Error(`Connection ${this.connectionId} is not open`);
    }
    this.socket.send(text);
    return this.record('outgoing', labelOf(text), text);
  }

  close(): void {
    this.closedByUser = true;
    this.retry.cancel();
    if (this.socket === null) return;
    this.setState('closing');
    this.socket.close();
  }

  private async connect(): Promise<void> {
    const target = this.target;
    if (target === null) return;

    // A URL rejected here has no socket to raise `error`, so the reason is
    // recorded by hand: the renderer shows failures in the activity log only,
    // and one that never reaches it would be a connect button that does nothing.
    let parsed: URL;
    try {
      parsed = assertWsUrl(target.url);
    } catch (error) {
      this.record('error', 'Error', errorMessage(error));
      throw error;
    }

    this.setState('connecting');

    const { options } = target;
    const socket = new WebSocket(parsed, options.protocols, {
      headers: options.headers,
      // Off accepts any certificate the server offers, which is what makes an
      // active interception of a `wss://` session possible. The renderer warns
      // for as long as it is off; here it is simply obeyed.
      rejectUnauthorized: options.verifyCertificate,
      maxPayload: options.maxMessageBytes,
    });
    this.socket = socket;
    this.stopKeepalive = startKeepalive(socket, options.keepalive);

    socket.on('message', (data: RawData, isBinary: boolean) => {
      const body = bodyOf(data, isBinary);
      this.record('incoming', labelOf(body), body);
    });
    socket.on('error', (error: Error) => {
      this.record('error', 'Error', error.message);
    });
    socket.on('close', (code: number, reason: Buffer) => {
      this.handleClose(socket, code, reason.toString('utf8'));
    });

    await new Promise<void>((resolve, reject) => {
      socket.once('open', () => {
        this.wasOpen = true;
        this.retry.reset();
        this.setState('open');
        resolve();
      });
      socket.once('error', reject);
    });
  }

  private handleClose(socket: WebSocket, code: number, reason: string): void {
    if (this.socket !== socket) return;
    this.socket = null;
    // Before anything else: the ping timer outlives the socket it was watching
    // and would otherwise keep the process awake between retries.
    this.stopKeepalive?.();
    this.stopKeepalive = null;
    // A close the user did not ask for on a socket that had reached `open` is
    // the peer hanging up, and the renderer flags exactly that case.
    const dropped = !this.closedByUser && this.wasOpen;
    this.record('status', `Cerrado (${String(code)})`, reason);
    this.setState(dropped ? 'dropped' : 'closed', String(code));

    if (!dropped) return;
    this.scheduleRetry();
  }

  private scheduleRetry(): void {
    const target = this.target;
    if (target === null) return;

    const policy = target.options.retry;
    const delay = this.retry.schedule(policy, () => {
      this.connect().catch((error: unknown) => {
        this.record('error', 'Error', errorMessage(error));
        this.scheduleRetry();
      });
    });
    // `null` is the policy having nothing left: exhausted, or switched off.
    if (delay === null) return;

    this.record(
      'status',
      `Reintentando (${String(this.retry.attempts)}/${String(policy.attempts)})`,
      `en ${String(delay)} ms`,
    );
  }

  private setState(state: ConnectionState, detail?: string): void {
    if (this.state === state) return;
    this.state = state;
    this.sink.state(state, detail);
  }

  private record(kind: ActivityKind, label: string, body: string): number {
    this.sequence += 1;
    this.sink.activity({
      id: `${this.connectionId}:${String(this.sequence)}`,
      connectionId: this.connectionId,
      sequence: this.sequence,
      kind,
      at: Date.now(),
      label,
      body,
      bytes: Buffer.byteLength(body, 'utf8'),
    });
    return this.sequence;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
