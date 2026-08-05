import type { ActivityKind } from '@shared/ipc/activity.js';
import { without } from './records.js';
import type { SliceCreator } from './types.js';

export type DialogName = 'variables' | null;

/** Which kinds the activity log leaves out. An absent key means shown. */
export type HiddenActivityKinds = Partial<Record<ActivityKind, true>>;

/**
 * Pure view state. Nothing derived lives here — selectors do that work.
 *
 * Actions are declared as function properties rather than methods: zustand
 * never binds them to the store, so a component is free to pull one out with a
 * selector. Method syntax would make that read a `this`-dependent unbound call.
 */
export type UiSlice = {
  activeConnectionId: string | null;
  selectedEventByConnection: Record<string, string>;
  selectedActivityByConnection: Record<string, string>;
  catalogQuery: string;
  activityQuery: string;
  /**
   * Not keyed by connection, like `activityQuery` beside it: only one log is on
   * screen at a time, and a filter that changed under the tabs would be a
   * setting the user has to remember they left on somewhere else.
   */
  hiddenActivityKinds: HiddenActivityKinds;
  dialog: DialogName;
  /**
   * The connection whose settings dialog is open. Here rather than inside a
   * component because two places open it — the gear in the connection bar and
   * the tab's `…` — and neither is an ancestor of the other.
   */
  settingsConnectionId: string | null;
  /**
   * Which collections are folded shut. An absent key means expanded, so a
   * collection created later opens instead of hiding what was just made.
   * View state, like `catalogQuery`: never written to the workspace file.
   */
  collapsedCollections: Record<string, true>;
  setActiveConnection: (connectionId: string | null) => void;
  setSelectedEvent: (connectionId: string, eventId: string) => void;
  setSelectedActivity: (connectionId: string, activityId: string | null) => void;
  setCatalogQuery: (query: string) => void;
  setActivityQuery: (query: string) => void;
  toggleActivityKind: (kind: ActivityKind) => void;
  setDialog: (dialog: DialogName) => void;
  openConnectionSettings: (connectionId: string) => void;
  closeConnectionSettings: () => void;
  toggleCollection: (collectionId: string) => void;
  collapseAllCollections: (collectionIds: string[]) => void;
  expandAllCollections: () => void;
};

export const createUiSlice: SliceCreator<UiSlice> = (set) => ({
  activeConnectionId: null,
  selectedEventByConnection: {},
  selectedActivityByConnection: {},
  catalogQuery: '',
  activityQuery: '',
  hiddenActivityKinds: {},
  dialog: null,
  settingsConnectionId: null,
  collapsedCollections: {},

  setActiveConnection: (connectionId) => {
    set({ activeConnectionId: connectionId });
  },

  setSelectedEvent: (connectionId, eventId) => {
    set((current) => ({
      selectedEventByConnection: { ...current.selectedEventByConnection, [connectionId]: eventId },
    }));
  },

  // `null` drops the entry rather than storing an empty string: the detail pane
  // exists only while a line is marked, so "nothing selected" has to be a state
  // the map can express.
  setSelectedActivity: (connectionId, activityId) => {
    set((current) => ({
      selectedActivityByConnection:
        activityId === null
          ? without(current.selectedActivityByConnection, connectionId)
          : { ...current.selectedActivityByConnection, [connectionId]: activityId },
    }));
  },

  setCatalogQuery: (query) => {
    set({ catalogQuery: query });
  },

  setActivityQuery: (query) => {
    set({ activityQuery: query });
  },

  // The key goes rather than being set to `false`, so "shown" has exactly one
  // representation and the filter never has to read a value to know it is off.
  toggleActivityKind: (kind) => {
    set((current) => ({
      hiddenActivityKinds:
        current.hiddenActivityKinds[kind] === true
          ? without(current.hiddenActivityKinds, kind)
          : { ...current.hiddenActivityKinds, [kind]: true },
    }));
  },

  setDialog: (dialog) => {
    set({ dialog });
  },

  openConnectionSettings: (connectionId) => {
    set({ settingsConnectionId: connectionId });
  },

  closeConnectionSettings: () => {
    set({ settingsConnectionId: null });
  },

  toggleCollection: (collectionId) => {
    set((current) => ({
      collapsedCollections:
        current.collapsedCollections[collectionId] === true
          ? without(current.collapsedCollections, collectionId)
          : { ...current.collapsedCollections, [collectionId]: true },
    }));
  },

  // The ids are passed in rather than read from the workspace: this slice knows
  // nothing about the catalog, and the toolbar already has the visible list.
  collapseAllCollections: (collectionIds) => {
    set({
      collapsedCollections: Object.fromEntries(collectionIds.map((id) => [id, true as const])),
    });
  },

  expandAllCollections: () => {
    set({ collapsedCollections: {} });
  },
});
