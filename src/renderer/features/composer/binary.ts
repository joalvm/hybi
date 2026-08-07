import { base64ByteLength, base64ToBytes, bytesToBase64 } from '@shared/binary/base64.js';
import { hexToBytes } from '@shared/binary/hex.js';

/**
 * Where the bytes of a binary payload come from. A view setting like the format
 * itself: the frame that leaves is the same bytes however they were spelled.
 */
export type BinarySource = 'hex' | 'base64' | 'file';

/** What is ready to leave, once the payload can be read at all. */
export type BinaryPayload = { body: string; bytes: number };

/**
 * The payload a written source spells, or `null` when it spells none. A half
 * byte is not a payload: sending what a broken spelling happens to parse to
 * would put bytes on the wire that nobody typed.
 */
export function readBinary(text: string, source: 'hex' | 'base64'): BinaryPayload | null {
  if (source === 'base64') {
    // Read back rather than trusted: the box is free text, and only a decode
    // says whether those characters are base64 at all.
    return base64ToBytes(text) === null ? null : { body: text, bytes: base64ByteLength(text) };
  }

  const bytes = hexToBytes(text);
  if (bytes === null) return null;
  return { body: bytesToBase64(bytes), bytes: bytes.byteLength };
}
