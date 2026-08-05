import type { ActivityRecord, ConnectionState } from '@shared/ipc/activity.js';
import type { TransportKind } from '@shared/domain/connections/connection.js';
import { without } from './records.js';
import { accumulate, type ActivityTotals } from './totals.js';
import type { SliceCreator } from './types.js';

/** How many records a single connection keeps before the oldest fall off. */
export const ACTIVITY_LIMIT = 2000;

/**
 * How many bytes of frame bodies a single connection keeps. The count above
 * cannot bound memory on its own: `maxMessageBytes` allows a frame far larger
 * than the whole log, so 2000 of them would be gigabytes the user never asked
 * to hold. Whichever limit is reached first decides what falls off.
 */
export const ACTIVITY_BYTE_LIMIT = 8 * 1024 * 1024;

/**
 * The window the log keeps, counting back from the newest record. Returns the
 * same array when nothing has to go, so an append that changes nothing does not
 * hand zustand a new reference.
 *
 * The newest record always survives, even alone over budget: dropping the frame
 * that just arrived would make the log lie about what the socket did.
 */
function withinBudget(records: ActivityRecord[]): ActivityRecord[] {
  if (records.length === 0) return records;

  const floor = Math.max(0, records.length - ACTIVITY_LIMIT);
  let start = records.length - 1;
  let bytes = records[start]?.bytes ?? 0;

  // Walk backwards from the newest, taking one more record only while it fits.
  while (start > floor) {
    const older = records[start - 1];
    if (older === undefined || bytes + older.bytes > ACTIVITY_BYTE_LIMIT) break;
    bytes += older.bytes;
    start -= 1;
  }

  return start === 0 ? records : records.slice(start);
}

/** Actions are function properties, not methods. See the note on `UiSlice`. */
export type RuntimeSlice = {
  states: Record<string, ConnectionState>;
  activity: Record<string, ActivityRecord[]>;
  /** Traffic moved per connection, which outlives the records the budget drops. */
  totals: Record<string, ActivityTotals>;
  drafts: Record<string, string>;
  setConnectionState: (connectionId: string, state: ConnectionState) => void;
  appendActivity: (records: ActivityRecord[]) => void;
  appendLocalError: (connectionId: string, transportKind: TransportKind, message: string) => void;
  clearActivity: (connectionId: string) => void;
  setDraft: (connectionId: string, eventId: string, text: string) => void;
  clearDraft: (connectionId: string, eventId: string) => void;
};

export const draftKey = (connectionId: string, eventId: string): string =>
  `${connectionId}:${eventId}`;

export const createRuntimeSlice: SliceCreator<RuntimeSlice> = (set) => ({
  states: {},
  activity: {},
  totals: {},
  drafts: {},

  setConnectionState: (connectionId, state) => {
    set((current) => ({ states: { ...current.states, [connectionId]: state } }));
  },

  /**
   * The batch is grouped by connection before anything is copied, so each log is
   * rebuilt once per batch instead of once per record. Appending record by record
   * cost one full copy of a 2000-entry array per frame — during a flood that was
   * megabytes of garbage every sixteen milliseconds, all of it immediately dead.
   */
  appendActivity: (records) => {
    if (records.length === 0) return;
    set((current) => {
      const incoming = new Map<string, ActivityRecord[]>();
      for (const record of records) {
        const batch = incoming.get(record.connectionId);
        if (batch === undefined) incoming.set(record.connectionId, [record]);
        else batch.push(record);
      }

      const activity = { ...current.activity };
      const totals = { ...current.totals };
      for (const [connectionId, batch] of incoming) {
        const existing = activity[connectionId];
        activity[connectionId] = withinBudget(
          existing === undefined ? batch : existing.concat(batch),
        );
        totals[connectionId] = accumulate(totals[connectionId], batch);
      }
      return { activity, totals };
    });
  },

  // A failure the main process never saw — the bridge itself refusing — still
  // belongs in the log, because the log is the only place errors are reported.
  // The sequence continues the connection's own numbering so the row sorts last.
  appendLocalError: (connectionId, transportKind, message) => {
    set((current) => {
      const existing = current.activity[connectionId] ?? [];
      const sequence = (existing.at(-1)?.sequence ?? 0) + 1;
      const record: ActivityRecord = {
        id: `${connectionId}:local:${String(sequence)}`,
        connectionId,
        transportKind,
        sequence,
        kind: 'error',
        at: Date.now(),
        label: 'Error',
        body: message,
        bytes: new TextEncoder().encode(message).length,
      };
      return {
        activity: {
          ...current.activity,
          [connectionId]: withinBudget(existing.concat(record)),
        },
      };
    });
  },

  // The key goes rather than being emptied: a live connection reads through a
  // selector that already answers an absent key with a shared empty list.
  clearActivity: (connectionId) => {
    set((current) => ({
      activity: without(current.activity, connectionId),
      // The counter describes the log: emptying one empties the other, or the
      // number would speak for frames nobody can look at any more.
      totals: without(current.totals, connectionId),
    }));
  },

  setDraft: (connectionId, eventId, text) => {
    set((current) => ({
      drafts: { ...current.drafts, [draftKey(connectionId, eventId)]: text },
    }));
  },

  clearDraft: (connectionId, eventId) => {
    const key = draftKey(connectionId, eventId);
    set((current) => ({ drafts: without(current.drafts, key) }));
  },
});
