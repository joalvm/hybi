import type { RawData } from 'ws';
import { bytesToBase64 } from '@shared/binary/base64.js';
import type { PayloadEncoding } from '@shared/binary/encoding.js';

/** A payload on its way into the log, already measured as it left the wire. */
export type Frame = {
  body: string;
  encoding: PayloadEncoding;
  bytes: number;
};

/**
 * One incoming frame, kept whole. A binary frame used to collapse to a sentence
 * about its size, which threw the payload away at the door: nothing downstream
 * could show it, resend it or export it, because nothing downstream ever had it.
 */
export function frameOf(data: RawData, isBinary: boolean): Frame {
  const buffer = toBuffer(data);
  const bytes = buffer.byteLength;
  if (isBinary) return { body: bytesToBase64(new Uint8Array(buffer)), encoding: 'base64', bytes };
  return { body: buffer.toString('utf8'), encoding: 'text', bytes };
}

/** A note the app wrote — a close code, a retry, a diagnosis — not a frame. */
export function textFrame(body: string): Frame {
  return { body, encoding: 'text', bytes: Buffer.byteLength(body, 'utf8') };
}

function toBuffer(data: RawData): Buffer {
  if (Array.isArray(data)) return Buffer.concat(data);
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}
