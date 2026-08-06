import { useEffect } from 'react';
import { bridge } from '@/ipc/bridge.js';
import { usePreferencesDialog } from './dialog.store.js';

/**
 * The dialog is also a native menu entry, so the main process can ask for it.
 * The gear in the title bar writes the same flag, which is why the flag is in a
 * store rather than in whichever component happens to render the dialog.
 */
export function usePreferenceRequests(): { open: boolean; close: () => void } {
  const open = usePreferencesDialog((state) => state.open);
  const openDialog = usePreferencesDialog((state) => state.openDialog);
  const closeDialog = usePreferencesDialog((state) => state.closeDialog);

  useEffect(() => bridge.app.onPreferencesRequested(openDialog), [openDialog]);

  return { open, close: closeDialog };
}
