import type { ActivityRecord, ConnectionState } from '@shared/ipc/activity.js';
import type { SliceCreator } from './types.js';

/** How many records a single connection keeps before the oldest fall off. */
export const ACTIVITY_LIMIT = 2000;

/** Actions are function properties, not methods. See the note on `UiSlice`. */
export type RuntimeSlice = {
  states: Record<string, ConnectionState>;
  activity: Record<string, ActivityRecord[]>;
  drafts: Record<string, string>;
  setConnectionState: (connectionId: string, state: ConnectionState) => void;
  appendActivity: (records: ActivityRecord[]) => void;
  appendLocalError: (connectionId: string, message: string) => void;
  clearActivity: (connectionId: string) => void;
  setDraft: (connectionId: string, eventId: string, text: string) => void;
  clearDraft: (connectionId: string, eventId: string) => void;
};

export const draftKey = (connectionId: string, eventId: string): string =>
  `${connectionId}:${eventId}`;

export const createRuntimeSlice: SliceCreator<RuntimeSlice> = (set) => ({
  states: {},
  activity: {},
  drafts: {},

  setConnectionState: (connectionId, state) => {
    set((current) => ({ states: { ...current.states, [connectionId]: state } }));
  },

  // The map is copied once per batch rather than once per record: the main
  // process already coalesces activity into frames, so batches arrive large.
  appendActivity: (records) => {
    set((current) => {
      const activity = { ...current.activity };
      for (const record of records) {
        const existing = activity[record.connectionId] ?? [];
        const next = existing.concat(record);
        activity[record.connectionId] =
          next.length > ACTIVITY_LIMIT ? next.slice(next.length - ACTIVITY_LIMIT) : next;
      }
      return { activity };
    });
  },

  // A failure the main process never saw — the bridge itself refusing — still
  // belongs in the log, because the log is the only place errors are reported.
  // The sequence continues the connection's own numbering so the row sorts last.
  appendLocalError: (connectionId, message) => {
    set((current) => {
      const existing = current.activity[connectionId] ?? [];
      const sequence = (existing.at(-1)?.sequence ?? 0) + 1;
      const record: ActivityRecord = {
        id: `${connectionId}:local:${String(sequence)}`,
        connectionId,
        sequence,
        kind: 'error',
        at: Date.now(),
        label: 'Error',
        body: message,
        bytes: new TextEncoder().encode(message).length,
      };
      const next = existing.concat(record);
      return {
        activity: {
          ...current.activity,
          [connectionId]:
            next.length > ACTIVITY_LIMIT ? next.slice(next.length - ACTIVITY_LIMIT) : next,
        },
      };
    });
  },

  clearActivity: (connectionId) => {
    set((current) => ({ activity: { ...current.activity, [connectionId]: [] } }));
  },

  setDraft: (connectionId, eventId, text) => {
    set((current) => ({
      drafts: { ...current.drafts, [draftKey(connectionId, eventId)]: text },
    }));
  },

  clearDraft: (connectionId, eventId) => {
    const key = draftKey(connectionId, eventId);
    set((current) => ({
      drafts: Object.fromEntries(
        Object.entries(current.drafts).filter(([entry]) => entry !== key),
      ),
    }));
  },
});
