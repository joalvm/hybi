import type { Connection, EventItem } from '@shared/domain/types.js';
import type { ActivityRecord } from '@shared/ipc/activity.js';
import { buildScope, type VariableScope } from '@shared/variables/resolve.js';
import { draftKey, type StoreState } from './index.js';
import { EMPTY_TOTALS, type ActivityTotals } from './totals.js';

/** A module constant so the selector keeps a stable reference between renders. */
const EMPTY_ACTIVITY: ActivityRecord[] = [];

export const selectActiveConnection = (state: StoreState): Connection | null => {
  const connectionId = state.activeConnectionId;
  if (connectionId === null) return null;
  return state.workspace?.connections.find((entry) => entry.id === connectionId) ?? null;
};

export const selectScopeFor =
  (connectionId: string) =>
  (state: StoreState): VariableScope => {
    const connection = state.workspace?.connections.find((entry) => entry.id === connectionId);
    const environment = state.workspace?.environments.find(
      (entry) => entry.id === connection?.environmentId,
    );
    return buildScope(environment?.variables ?? []);
  };

export const selectSelectedEvent =
  (connectionId: string) =>
  (state: StoreState): EventItem | null => {
    const eventId = state.selectedEventByConnection[connectionId];
    if (eventId === undefined) return null;
    return state.workspace?.catalog.items.find((entry) => entry.id === eventId) ?? null;
  };

/**
 * The name of the collection the open event lives in: the first crumb of the
 * composer's breadcrumb. A string rather than the collection, so the selector
 * returns a stable primitive and needs no shallow comparison.
 */
export const selectCollectionNameFor =
  (connectionId: string) =>
  (state: StoreState): string => {
    const event = selectSelectedEvent(connectionId)(state);
    if (event === null) return '';
    const collection = state.workspace?.catalog.collections.find(
      (entry) => entry.id === event.collectionId,
    );
    return collection?.name ?? '';
  };

/** The draft wins over the stored payload, so edits survive a re-render. */
export const selectEffectivePayload =
  (connectionId: string) =>
  (state: StoreState): string | null => {
    const eventId = state.selectedEventByConnection[connectionId];
    if (eventId === undefined) return null;
    return (
      state.drafts[draftKey(connectionId, eventId)] ??
      selectSelectedEvent(connectionId)(state)?.payload ??
      null
    );
  };

export const selectIsDirty =
  (connectionId: string) =>
  (state: StoreState): boolean => {
    const eventId = state.selectedEventByConnection[connectionId];
    if (eventId === undefined) return false;
    const draft = state.drafts[draftKey(connectionId, eventId)];
    if (draft === undefined) return false;
    return draft !== selectSelectedEvent(connectionId)(state)?.payload;
  };

export const selectActivityFor =
  (connectionId: string) =>
  (state: StoreState): ActivityRecord[] =>
    state.activity[connectionId] ?? EMPTY_ACTIVITY;

/**
 * The stored totals, or the shared empty one. The reference only changes when a
 * frame moved, so the counter is not repainted by every batch of status lines.
 */
export const selectTotalsFor =
  (connectionId: string) =>
  (state: StoreState): ActivityTotals =>
    state.totals[connectionId] ?? EMPTY_TOTALS;
