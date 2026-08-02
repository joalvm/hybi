import { DEFAULT_CONNECTION_SETTINGS } from '@shared/domain/defaults.js';
import type { ActivityRecord, ConnectionStateEvent } from '@shared/ipc/activity.js';
import type { OpenRequest, SocketOptions } from '@shared/ipc/contract.js';
import { WsSession, type RetryOptions } from './session.js';

export type ConnectionSink = {
  state(event: ConnectionStateEvent): void;
  activity(record: ActivityRecord): void;
};

const { attempts, baseMs, maxMs } = DEFAULT_CONNECTION_SETTINGS.retry;
const DEFAULT_RETRY: RetryOptions = { baseMs, maxMs, attempts };

/** Owns one `WsSession` per connection id and fans their events into one sink. */
export class ConnectionManager {
  private readonly sessions = new Map<string, WsSession>();

  constructor(
    private readonly sink: ConnectionSink,
    private readonly retry: RetryOptions = DEFAULT_RETRY,
  ) {}

  async open(request: OpenRequest): Promise<void> {
    const session = this.sessionFor(request.connectionId);
    await session.open(request.url, request.options ?? this.fallbackOptions());
  }

  send(connectionId: string, text: string): number {
    const session = this.sessions.get(connectionId);
    if (session === undefined) {
      throw new Error(`Connection ${connectionId} is not open`);
    }
    return session.send(text);
  }

  close(connectionId: string): void {
    this.sessions.get(connectionId)?.close();
  }

  disposeAll(): void {
    for (const session of this.sessions.values()) session.close();
    this.sessions.clear();
  }

  /**
   * What a request with no options opens with. The retry half comes from this
   * manager's own policy so a caller that tuned it — the tests do — still gets
   * what it asked for; everything else is the domain default.
   */
  private fallbackOptions(): SocketOptions {
    return {
      headers: {},
      protocols: [],
      retry: { enabled: true, ...this.retry },
      keepalive: { ...DEFAULT_CONNECTION_SETTINGS.keepalive },
      verifyCertificate: DEFAULT_CONNECTION_SETTINGS.verifyCertificate,
      maxMessageBytes: DEFAULT_CONNECTION_SETTINGS.maxMessageBytes,
    };
  }

  private sessionFor(connectionId: string): WsSession {
    const existing = this.sessions.get(connectionId);
    if (existing !== undefined) return existing;

    const session = new WsSession(connectionId, {
      state: (state, detail) => {
        this.sink.state(
          detail === undefined ? { connectionId, state } : { connectionId, state, detail },
        );
      },
      activity: (record) => {
        this.sink.activity(record);
      },
    });

    this.sessions.set(connectionId, session);
    return session;
  }
}
