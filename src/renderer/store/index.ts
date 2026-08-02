import { create } from 'zustand';
import { createRuntimeSlice, type RuntimeSlice } from './runtime.slice.js';
import { createUiSlice, type UiSlice } from './ui.slice.js';
import { createWorkspaceSlice, type WorkspaceSlice } from './workspace.slice.js';

export { ACTIVITY_LIMIT, draftKey } from './runtime.slice.js';
export type { DialogName } from './ui.slice.js';

export type StoreState = WorkspaceSlice & RuntimeSlice & UiSlice & { reset(): void };

export const useStore = create<StoreState>()((set, get, store) => ({
  ...createWorkspaceSlice(set, get, store),
  ...createRuntimeSlice(set, get, store),
  ...createUiSlice(set, get, store),

  // `true` replaces the state instead of merging it, so stale connection ids
  // cannot survive a workspace switch inside the record-shaped slices.
  reset: () => {
    set(store.getInitialState(), true);
  },
}));
