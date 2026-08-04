import { useMemo } from 'react';
import type { ActivityRecord } from '@shared/ipc/activity.js';

/**
 * The query compiled once for the whole pass, or `null` when there is nothing to
 * match. A case-insensitive pattern rather than `toLowerCase().includes()`: the
 * lowercased copy was a fresh allocation of every body in the log on every batch,
 * and bodies are the largest thing the renderer holds.
 *
 * The needle is escaped, so what the user typed is text and not syntax.
 */
function matcher(query: string): RegExp | null {
  const needle = query.trim();
  if (needle === '') return null;
  return new RegExp(needle.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&'), 'i');
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
 * Filtered and reversed in one pass: what the list receives is what it draws.
 *
 * One pass and one array, walked from the end. Filtering and then reversing built
 * two arrays of the whole log for every batch the socket delivered — during a
 * flood that is sixty throwaway copies a second, and the second one existed only
 * to put the newest frame on top.
 *
 * The store's array is never touched: it is shared with every other reader.
 */
export function newestFirstMatching(records: ActivityRecord[], query: string): ActivityRecord[] {
  const pattern = matcher(query);
  const visible: ActivityRecord[] = [];

  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (record === undefined) continue;
    if (pattern === null || pattern.test(record.label) || pattern.test(record.body)) {
      visible.push(record);
    }
  }

  return visible;
}

export function useActivityFilter(records: ActivityRecord[], query: string): ActivityRecord[] {
  return useMemo(() => newestFirstMatching(records, query), [records, query]);
}
