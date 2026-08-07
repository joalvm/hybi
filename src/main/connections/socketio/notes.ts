import { format } from '@lang/translate.js';
import { mainMessages } from '../../lang.js';

/**
 * The status lines the session writes into the activity log. They are sentences
 * the user reads, so they live in the catalog rather than inside the client's
 * event handlers.
 */
export function joinedNote(namespace: string): { label: string; body: string } {
  const notes = mainMessages().activity.socketio;
  return { label: notes.joined, body: format(notes.namespace, { namespace }) };
}

export function disconnectNote(reason: string): { label: string; body: string } {
  const notes = mainMessages().activity.socketio;
  return { label: notes.disconnected, body: format(notes.reason, { reason }) };
}

export function reconnectNote(attempt: number): { label: string; body: string } {
  const notes = mainMessages().activity.socketio;
  return { label: format(notes.reconnecting, { attempt }), body: '' };
}

/**
 * An emit that asked for an answer and did not get one in time. It is an error
 * rather than a status line: the server was asked a question and never replied.
 */
export function ackTimeoutNote(event: string, timeout: number): string {
  return format(mainMessages().activity.socketio.ackTimeout, { event, timeout });
}
