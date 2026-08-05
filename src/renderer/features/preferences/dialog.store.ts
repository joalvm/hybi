import { create } from 'zustand';

/** Actions are function properties, not methods. See the note on `UiSlice`. */
type PreferencesDialogStore = {
  open: boolean;
  openDialog: () => void;
  closeDialog: () => void;
};

/**
 * Whether the preferences dialog is up. Its own store and not `UiSlice`: two
 * places open it — the gear in the title bar and the native menu entry — the
 * welcome window is one of the windows that paints it, and that window owns no
 * workspace store to hang the flag on.
 */
export const usePreferencesDialog = create<PreferencesDialogStore>()((set) => ({
  open: false,

  openDialog: () => {
    set({ open: true });
  },

  closeDialog: () => {
    set({ open: false });
  },
}));
