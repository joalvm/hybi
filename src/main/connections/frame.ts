import type { RawData } from 'ws';

/**
 * What the activity log stores for one incoming frame.
 *
 * A binary frame is described rather than decoded: the log is text, and a
 * megabyte of bytes rendered as mojibake tells the reader less than its size.
 */
export function bodyOf(data: RawData, isBinary: boolean): string {
  const buffer = toBuffer(data);
  return isBinary
    ? `<binario ${String(buffer.byteLength)} bytes>`
    : buffer.toString('utf8');
}

/** `ws` hands over a Buffer, an ArrayBuffer or the fragments of one frame. */
function toBuffer(data: RawData): Buffer {
  if (Array.isArray(data)) return Buffer.concat(data);
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}
