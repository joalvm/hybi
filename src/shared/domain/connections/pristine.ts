import type { ConnectionTransport } from './connection.js';
import { cloneConnectionTransport } from './defaults.js';
import { createTransport } from './factory.js';

/**
 * Whether this transport still holds exactly what the factory handed it — no
 * URL written, no setting touched. It is the question a control that replaces a
 * transport has to answer before it does: `createTransport` starts the new one
 * from its own defaults and keeps nothing, so on a configured connection that is
 * a discard, and on a fresh one it is nothing at all.
 *
 * Both sides go through `cloneConnectionTransport`, which writes its properties
 * in a fixed order. That is what makes comparing the two serializations honest:
 * a document read back from disk was rebuilt in whatever order it was written,
 * and the order it happened to use must not decide the answer.
 */
export function isTransportPristine(transport: ConnectionTransport): boolean {
  return (
    JSON.stringify(cloneConnectionTransport(transport)) ===
    JSON.stringify(createTransport(transport.kind))
  );
}
