import { useMemo } from 'react';
import type { ActivityRecord } from '@shared/ipc/activity.js';

export function filterActivity(records: ActivityRecord[], query: string): ActivityRecord[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return records;
  return records.filter(
    (record) =>
      record.label.toLowerCase().includes(needle) || record.body.toLowerCase().includes(needle),
  );
}

/** Relative to the first record, because absolute clock time says nothing here. */
export function formatOffset(at: number, origin: number): string {
  const elapsed = Math.max(0, at - origin);
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const tenths = Math.floor((elapsed % 1000) / 100);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(tenths)}`;
}

/**
 * The order the log is read in: newest first, so the frame that just arrived is
 * at the top instead of under everything that came before it. The copy is
 * deliberate — the store's array is shared and must not be reversed in place.
 */
export function newestFirst(records: ActivityRecord[]): ActivityRecord[] {
  return [...records].reverse();
}

/** Filtered and ordered in one pass: what the list receives is what it draws. */
export function useActivityFilter(records: ActivityRecord[], query: string): ActivityRecord[] {
  return useMemo(() => newestFirst(filterActivity(records, query)), [records, query]);
}
