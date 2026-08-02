import { BrowserWindow, ipcMain } from 'electron';
import { CHANNELS } from '@shared/ipc/contract.js';

type Actions = {
  /** Opens the document in the workbench window and retires the caller. */
  openWorkspace: (workspaceId: string, from: BrowserWindow | null) => void;
};

/**
 * The one request the welcome window makes that is not about its own document
 * list: hand this workspace over to the editor. The window it replaces is
 * resolved from the sender, so welcome never names the window it closes.
 */
export function registerShellHandlers(actions: Actions): () => void {
  ipcMain.handle(CHANNELS.shellOpenWorkspace, (event, workspaceId: string): void => {
    actions.openWorkspace(workspaceId, BrowserWindow.fromWebContents(event.sender));
  });

  return () => {
    ipcMain.removeHandler(CHANNELS.shellOpenWorkspace);
  };
}
