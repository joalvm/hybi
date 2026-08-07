import type { PayloadEncoding } from '@shared/binary/encoding.js';
import type { TransportKind } from '@shared/domain/types.js';
import type { SocketIoArgument } from '@shared/transport/contract.js';
import type { PayloadFormat } from './formats.js';
import type { BinaryComposer } from './useBinaryPayload.js';
import type { EmitDraft } from './useEmitDraft.js';
import type { OutgoingDraft } from './useSendMessage.js';

/**
 * Socket.IO emits a value rather than bytes, so the format is what says which
 * value: JSON becomes the object the text spells, everything else stays the
 * string it is. Declared here and sent as part of the command, because a main
 * process that parsed whatever happened to look like JSON would send an object
 * where a string was typed.
 */
function argumentOf(format: PayloadFormat): SocketIoArgument {
  if (format === 'binary') return 'binary';
  return format === 'json' ? 'json' : 'text';
}

/** What leaves, assembled from the editor, the binary strip and the emit bar. */
export function outgoingDraft(
  format: PayloadFormat,
  resolved: string,
  binary: BinaryComposer,
  emit: EmitDraft,
): OutgoingDraft {
  const binaryMode = format === 'binary';
  // Binary mode sends the bytes the payload spells, not the spelling; every
  // other format sends the resolved text exactly as written.
  const body = binaryMode ? (binary.payload?.body ?? '') : resolved;
  const encoding: PayloadEncoding = binaryMode ? 'base64' : 'text';
  return { body, encoding, event: emit.event, argument: argumentOf(format), ack: emit.ack };
}

/**
 * Whether there is nothing to send. Socket.IO adds a second way to have nothing:
 * an emit with no name has nowhere to arrive, however much payload it carries.
 */
export function outgoingEmpty(
  format: PayloadFormat,
  emptyText: boolean,
  binary: BinaryComposer,
  emit: EmitDraft,
  transportKind: TransportKind | null,
): boolean {
  if (transportKind === 'socketio' && emit.event.trim() === '') return true;
  return format === 'binary' ? (binary.payload?.bytes ?? 0) === 0 : emptyText;
}
