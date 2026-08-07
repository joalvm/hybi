import type { RawData } from 'ws';
import { base64ToBytes, bytesToBase64 } from '@shared/binary/base64.js';
import type { WebSocketTransportMessage } from '@shared/transport/contract.js';
import { textFrame, type Frame } from '../frame.js';

export { textFrame, type Frame } from '../frame.js';

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

/**
 * What a send command puts on the socket, and the record of it. `null` for a
 * base64 body that is not base64: the renderer builds the encoding, but the
 * main process does not take its word for it before writing to a socket.
 */
export function outgoingFrame(
  message: WebSocketTransportMessage,
): { payload: string | Buffer; frame: Frame } | null {
  if (message.encoding === 'text') {
    return { payload: message.body, frame: textFrame(message.body) };
  }

  const bytes = base64ToBytes(message.body);
  if (bytes === null) return null;
  return {
    payload: Buffer.from(bytes),
    frame: { body: message.body, encoding: 'base64', bytes: bytes.byteLength },
  };
}

function toBuffer(data: RawData): Buffer {
  if (Array.isArray(data)) return Buffer.concat(data);
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}
