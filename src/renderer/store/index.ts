import { create } from 'zustand';
import { dropConnectionState } from './drop-connection.js';
import { createRuntimeSlice, type RuntimeSlice } from './runtime.slice.js';
import { createUiSlice, type UiSlice } from './ui.slice.js';
import { createWorkspaceSlice, type WorkspaceSlice } from './workspace.slice.js';

export { ACTIVITY_BYTE_LIMIT, ACTIVITY_LIMIT, draftKey } from './runtime.slice.js';
export type { DialogName } from './ui.slice.js';

export type StoreState = WorkspaceSlice &
  RuntimeSlice &
  UiSlice & {
    reset(): void;
    /** Forgets one connection across every slice that keyed anything by it. */
    dropConnection(connectionId: string): void;
  };

export const useStore = create<StoreState>()((set, get, store) => ({
  ...createWorkspaceSlice(set),
  ...createRuntimeSlice(set),
  ...createUiSlice(set),

  // `true` replaces the state instead of merging it, so stale connection ids
  // cannot survive a workspace switch inside the record-shaped slices.
  reset: () => {
    set(store.getInitialState(), true);
  },

  // Composed here rather than in a slice: the keys it clears live in three of
  // them, and only this file sees all three.
  dropConnection: (connectionId) => {
    set((current) => dropConnectionState(current, connectionId));
  },
}));
