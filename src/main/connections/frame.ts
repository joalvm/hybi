import type { PayloadEncoding } from '@shared/binary/encoding.js';

/** A payload on its way into the log, already measured as it left the wire. */
export type Frame = {
  body: string;
  encoding: PayloadEncoding;
  bytes: number;
};

/** A note the app wrote — a close code, a retry, a diagnosis — not a frame. */
export function textFrame(body: string): Frame {
  return { body, encoding: 'text', bytes: Buffer.byteLength(body, 'utf8') };
}
