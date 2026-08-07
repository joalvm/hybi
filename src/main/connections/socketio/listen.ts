import type { Socket } from 'socket.io-client';
import type { ResolvedSocketIoTransport } from '@shared/transport/contract.js';
import { textFrame } from '../frame.js';
import { incomingFrame } from './frame.js';
import { disconnectNote, joinedNote, reconnectNote } from './notes.js';
import type { SocketIoReporter } from './reporter.js';

/** What the session needs to know about a client it did not close itself. */
export type SessionHooks = {
  closedByUser: () => boolean;
};

/**
 * A server that wants an answer sends a callback as the last argument. It is
 * dropped rather than logged: a function has no body to record, and answering
 * on the user's behalf would invent a reply they never wrote.
 */
function withoutAck(args: unknown[]): unknown[] {
  return typeof args.at(-1) === 'function' ? args.slice(0, -1) : args;
}

/** Wires one client's whole lifecycle into the log. */
export function listen(
  socket: Socket,
  target: ResolvedSocketIoTransport,
  reporter: SocketIoReporter,
  hooks: SessionHooks,
): void {
  socket.on('connect', () => {
    reporter.state('open');
    const note = joinedNote(target.namespace);
    reporter.record('status', note.label, textFrame(note.body));
  });

  socket.on('connect_error', (error: Error) => {
    reporter.failure(error, target.url);
    // `active` is Socket.IO saying whether it intends to try again. When it does
    // not — a rejected handshake, or attempts exhausted — the attempt is over.
    if (!socket.active) reporter.state('error');
  });

  socket.on('disconnect', (reason: string) => {
    const note = disconnectNote(reason);
    reporter.record('status', note.label, textFrame(note.body));
    // Who closed it, not whether it will come back. A server that disconnects a
    // socket on purpose is never retried by Socket.IO, and a transport that
    // simply died is — but both are the peer ending a connection the user did
    // not ask to end, which is the close worth saying out loud.
    reporter.state(hooks.closedByUser() ? 'closed' : 'dropped', reason);
  });

  socket.io.on('reconnect_attempt', (attempt: number) => {
    const note = reconnectNote(attempt);
    reporter.record('status', note.label, textFrame(note.body));
  });

  // Every event the server sends, under whatever name it chose. The label is the
  // name itself: unlike a raw frame, a Socket.IO payload arrives already saying
  // what it is, and no preview of the body says it better.
  socket.onAny((event: string, ...args: unknown[]) => {
    reporter.record('incoming', event, incomingFrame(withoutAck(args)), { event });
  });
}
