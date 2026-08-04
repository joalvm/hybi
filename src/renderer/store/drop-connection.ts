import type { StoreState } from './index.js';
import { draftKey } from './runtime.slice.js';
import { without, withoutPrefix } from './records.js';

/**
 * Everything the runtime and the view remember about one connection, forgotten
 * in a single set.
 *
 * A deleted tab used to leave its log, its socket state, its drafts and its
 * selections behind under a key nothing could ever read again — up to the full
 * activity budget per closed tab, held for the rest of the session. That is the
 * app growing on its own, which is exactly what it must not do.
 *
 * Pure and outside the slices because the keys it clears belong to three of
 * them: only the composition root sees them all at once.
 */
export function dropConnectionState(
  state: StoreState,
  connectionId: string,
): Partial<StoreState> {
  return {
    activity: without(state.activity, connectionId),
    states: without(state.states, connectionId),
    // Drafts are keyed by connection and event, so the prefix is what identifies
    // them. `draftKey` with an empty event id is that prefix, taken from the one
    // place that decides the shape of the key.
    drafts: withoutPrefix(state.drafts, draftKey(connectionId, '')),
    selectedEventByConnection: without(state.selectedEventByConnection, connectionId),
    selectedActivityByConnection: without(state.selectedActivityByConnection, connectionId),
    // A dialog cannot stay open over a connection that is gone. Another
    // connection's dialog is none of this function's business.
    settingsConnectionId:
      state.settingsConnectionId === connectionId ? null : state.settingsConnectionId,
  };
}
