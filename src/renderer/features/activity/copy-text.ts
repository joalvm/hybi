import type { Messages } from '@lang/translate.js';
import type { ActivityRecord } from '@shared/ipc/activity.js';
import { formatOffset } from './useActivityFilter.js';

/** What the clipboard receives: the frame itself, or the line as it is read. */
export type CopyScope = 'body' | 'row';

/** What each kind is called in the language the log is being read in. */
export type KindLabels = Messages['activity']['kinds'];

/**
 * The row as one tab-separated line, which is what pasting a log line into an
 * issue or a spreadsheet needs. The frame is flattened here — a row is a line,
 * and a multi-line body pasted as three would stop being one. `copy-body` is
 * the scope that hands over the exact text that crossed the socket.
 */
export function rowText(record: ActivityRecord, origin: number, kinds: KindLabels): string {
  const body = record.body.replace(/\s+/g, ' ').trim();
  return [formatOffset(record.at, origin), kinds[record.kind], record.label, body].join('\t');
}

/** The text one scope puts on the clipboard. */
export function copyText(
  record: ActivityRecord,
  scope: CopyScope,
  origin: number,
  kinds: KindLabels,
): string {
  return scope === 'body' ? record.body : rowText(record, origin, kinds);
}
