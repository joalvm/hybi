import type { ActivityRecord, ConnectionState } from '@shared/ipc/activity.js';
import type { TransportKind } from '@shared/domain/connections/connection.js';
import { withinBudget } from './budget.js';
import { without } from './records.js';
import { accumulate, type ActivityTotals } from './totals.js';
import type { SliceCreator } from './types.js';

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
        encoding: 'text',
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
