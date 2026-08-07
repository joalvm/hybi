import { base64ToBytes, bytesToBase64 } from '@shared/binary/base64.js';
import type { SocketIoTransportMessage } from '@shared/transport/contract.js';
import { textFrame, type Frame } from '../frame.js';

/** An argument that could not be read, and which of the two ways it failed. */
export type ArgumentDefect = { ok: false; reason: 'base64' | 'json' };

export type OutgoingArgument = { ok: true; argument: unknown; frame: Frame };

/**
 * The value one `emit` carries, and the record of it. The renderer says how to
 * read the body and the main process still checks: a payload that claims to be
 * base64 and is not would otherwise reach the socket as its own spelling.
 */
export function outgoingArgument(
  message: SocketIoTransportMessage,
): OutgoingArgument | ArgumentDefect {
  if (message.argument === 'binary') {
    const bytes = base64ToBytes(message.body);
    if (bytes === null) return { ok: false, reason: 'base64' };
    return {
      ok: true,
      argument: Buffer.from(bytes),
      frame: { body: message.body, encoding: 'base64', bytes: bytes.byteLength },
    };
  }

  if (message.argument === 'text') {
    return { ok: true, argument: message.body, frame: textFrame(message.body) };
  }

  try {
    return { ok: true, argument: JSON.parse(message.body), frame: textFrame(message.body) };
  } catch {
    return { ok: false, reason: 'json' };
  }
}

/**
 * One event's arguments, kept whole. A lone argument is logged as itself so a
 * frame can be sent back the way it arrived; several are logged as the list
 * they are, which is what the server was handed.
 *
 * A binary argument keeps its bytes rather than a JSON spelling of them: that
 * is the difference between a frame that can be resent and a description of one.
 */
export function incomingFrame(args: unknown[]): Frame {
  const only = args.length === 1 ? args[0] : undefined;
  const bytes = binaryOf(only);
  if (bytes !== null) {
    return { body: bytesToBase64(bytes), encoding: 'base64', bytes: bytes.byteLength };
  }
  return textFrame(jsonOf(args.length === 1 ? only : args));
}

function binaryOf(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return null;
}

/** `undefined` has no JSON spelling, and an argument may well be one. */
export function jsonOf(value: unknown): string {
  return value === undefined ? 'null' : JSON.stringify(value);
}
