import { base64ToBytes } from '@shared/binary/base64.js';
import { bytesToHex } from '@shared/binary/hex.js';
import type { ActivityRecord } from '@shared/ipc/activity.js';

/**
 * Long enough to recognise a frame, short enough that the row never pays to lay
 * out text it will ellipsize anyway.
 */
const PREVIEW_LENGTH = 160;

/**
 * How much of the body the preview reads. A row shows 160 characters, so
 * flattening a whole frame to find them allocated a second copy of a body that
 * can be megabytes — per row, per render, while the log scrolls.
 */
const PREVIEW_WINDOW = PREVIEW_LENGTH * 8;

/** Bytes of a binary frame the row spells out. Three characters each. */
const PREVIEW_BYTES = 24;

/** Base64 characters those bytes occupy, rounded to whole groups. */
const PREVIEW_DIGITS = Math.ceil(PREVIEW_BYTES / 3) * 4;

/**
 * One line of the raw frame, or nothing when the label is already made of it.
 * `labelOf` only lifts a name out of an `{event, data}` envelope; every other
 * frame gets a truncated copy of its own body as a label, and printing that
 * twice in one row is noise.
 */
function textPreview(body: string, label: string): string {
  const flat = body.slice(0, PREVIEW_WINDOW).replace(/\s+/g, ' ').trim();
  if (flat === '' || flat.startsWith(label.replace(/…$/, ''))) return '';
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH)}…` : flat;
}

/**
 * The first bytes as hex pairs. Base64 in the preview column would be
 * unreadable and, worse, would look like text that arrived; hex is what the
 * detail pane shows, so the row previews the frame as it is about to be opened.
 *
 * Only the leading groups are decoded — the row shows two dozen bytes, and
 * decoding a megabyte to find them is the cost this window exists to avoid.
 */
function binaryPreview(body: string, bytes: number): string {
  const head = base64ToBytes(body.slice(0, PREVIEW_DIGITS).replace(/=+$/, ''));
  if (head === null) return '';

  const shown = head.subarray(0, PREVIEW_BYTES);
  const pairs = bytesToHex(shown).replace(/(..)(?=.)/g, '$1 ');
  return bytes > shown.length ? `${pairs} …` : pairs;
}

export function previewOf(record: ActivityRecord): string {
  if (record.encoding === 'base64') return binaryPreview(record.body, record.bytes);
  return textPreview(record.body, record.label);
}
