import type { SliceCreator } from './types.js';

export type DialogName = 'variables' | null;

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
    set((current) => {
      const rest = Object.fromEntries(
        Object.entries(current.selectedActivityByConnection).filter(
          ([entry]) => entry !== connectionId,
        ),
      );
      return {
        selectedActivityByConnection:
          activityId === null ? rest : { ...rest, [connectionId]: activityId },
      };
    });
  },

  setCatalogQuery: (query) => {
    set({ catalogQuery: query });
  },

  setActivityQuery: (query) => {
    set({ activityQuery: query });
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
    set((current) => {
      const rest = Object.fromEntries(
        Object.entries(current.collapsedCollections).filter(([entry]) => entry !== collectionId),
      );
      return {
        collapsedCollections:
          current.collapsedCollections[collectionId] === true
            ? rest
            : { ...rest, [collectionId]: true },
      };
    });
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
