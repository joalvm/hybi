import type { ActivityRecord, ConnectionStateEvent } from '@shared/ipc/activity.js';
import type {
  OpenConnectionRequest,
  TransportMessage,
} from '@shared/transport/contract.js';
import {
  createTransportSession,
  type TransportSession,
  type TransportSessionFactory,
} from './transport.js';

export type ConnectionSink = {
  state(event: ConnectionStateEvent): void;
  activity(record: ActivityRecord): void;
};

type OwnedSession = { owner: symbol; session: TransportSession };

/** Orchestrates transport sessions without knowing their concrete resources. */
export class ConnectionManager {
  private readonly sessions = new Map<string, OwnedSession>();

  constructor(
    private readonly sink: ConnectionSink,
    private readonly createSession: TransportSessionFactory = createTransportSession,
  ) {}

  async open(request: OpenConnectionRequest): Promise<void> {
    const session = this.sessionFor(request.connectionId, request.transport.kind);
    await session.open(request.transport);
  }

  async send(connectionId: string, message: TransportMessage): Promise<number> {
    const owned = this.sessions.get(connectionId);
    if (owned === undefined) {
      throw new Error(`Connection ${connectionId} is not open`);
    }
    return owned.session.send(message);
  }

  close(connectionId: string): void {
    this.sessions.get(connectionId)?.session.close();
  }

  /**
   * The connection itself is gone, not just its socket. `close` keeps the session
   * because the same tab can dial again and wants the same sequence; this drops
   * it, because nothing will ever observe that id again. Without it the map only
   * ever grew, holding a resolved target per connection the user had closed.
   */
  dispose(connectionId: string): void {
    const owned = this.sessions.get(connectionId);
    if (owned === undefined) return;
    this.sessions.delete(connectionId);
    owned.session.dispose();
  }

  disposeAll(): void {
    const owned = [...this.sessions.values()];
    this.sessions.clear();
    for (const { session } of owned) session.dispose();
  }

  private sessionFor(connectionId: string, kind: TransportSession['kind']): TransportSession {
    const existing = this.sessions.get(connectionId);
    if (existing?.session.kind === kind) return existing.session;
    if (existing !== undefined) {
      this.sessions.delete(connectionId);
      existing.session.dispose();
    }

    const owner = Symbol(connectionId);
    const session = this.createSession(kind, connectionId, {
      state: (state, detail) => {
        if (!this.owns(connectionId, owner)) return;
        this.sink.state(
          detail === undefined ? { connectionId, state } : { connectionId, state, detail },
        );
      },
      activity: (record) => {
        if (this.owns(connectionId, owner)) this.sink.activity(record);
      },
    });

    this.sessions.set(connectionId, { owner, session });
    return session;
  }

  private owns(connectionId: string, owner: symbol): boolean {
    return this.sessions.get(connectionId)?.owner === owner;
  }
}
