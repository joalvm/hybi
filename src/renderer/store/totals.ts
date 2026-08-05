import type { ActivityRecord } from '@shared/ipc/activity.js';

/** What one connection has moved since its log was last cleared. */
export type ActivityTotals = {
  incoming: { messages: number; bytes: number };
  outgoing: { messages: number; bytes: number };
};

/** Shared, so a connection that has moved nothing hands back one identity. */
export const EMPTY_TOTALS: ActivityTotals = {
  incoming: { messages: 0, bytes: 0 },
  outgoing: { messages: 0, bytes: 0 },
};

/**
 * Accumulated as the batch lands instead of derived from the log. The budget in
 * `runtime.slice.ts` evicts records once the connection is over 2000 frames or
 * 8 MB, so a counter recomputed from what survived would run backwards while the
 * socket was still delivering. Walking the batch is also the cheap direction:
 * the cost is the frames that arrived, not the frames being held.
 *
 * Status and error lines are not traffic and never reach either side.
 */
export function accumulate(
  current: ActivityTotals | undefined,
  batch: readonly ActivityRecord[],
): ActivityTotals {
  const base = current ?? EMPTY_TOTALS;
  const incoming = { ...base.incoming };
  const outgoing = { ...base.outgoing };
  let moved = false;

  for (const record of batch) {
    if (record.kind !== 'incoming' && record.kind !== 'outgoing') continue;
    const side = record.kind === 'incoming' ? incoming : outgoing;
    side.messages += 1;
    side.bytes += record.bytes;
    moved = true;
  }

  // A batch of nothing but status lines leaves the reference alone, so the
  // counter does not repaint for a reconnect notice.
  return moved ? { incoming, outgoing } : base;
}
