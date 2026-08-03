import type { RawData } from 'ws';

/** Converts one incoming frame into the activity log's exact text representation. */
export function bodyOf(data: RawData, isBinary: boolean): string {
  const buffer = toBuffer(data);
  return isBinary ? `<binario ${String(buffer.byteLength)} bytes>` : buffer.toString('utf8');
}

function toBuffer(data: RawData): Buffer {
  if (Array.isArray(data)) return Buffer.concat(data);
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}
