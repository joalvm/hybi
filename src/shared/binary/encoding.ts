import { base64ByteLength } from './base64.js';

/**
 * How to read a payload that travels as a string. A frame that is not text
 * crosses the bridge base64-encoded rather than as bytes: every consumer of a
 * body — the filter, the clipboard, the export, the redaction — already speaks
 * `string`, and base64 round-trips byte for byte, so the alternative bought a
 * branch in each of them and nothing else.
 */
export type PayloadEncoding = 'text' | 'base64';

/** What the payload weighs on the wire, which is never its character count. */
export function byteLengthOf(body: string, encoding: PayloadEncoding): number {
  if (encoding === 'base64') return base64ByteLength(body);
  return new TextEncoder().encode(body).length;
}
