import { mkdir } from 'node:fs/promises';
import { BrowserWindow, ipcMain, shell } from 'electron';
import { CHANNELS } from '@shared/ipc/contract.js';
import { logDirectory } from '../log/paths.js';

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

  // Created on the way out: on an installation that has not logged anything yet
  // the directory does not exist, and opening a path that is not there fails
  // silently — which reads as a button that does nothing.
  ipcMain.handle(CHANNELS.shellOpenLogs, async (): Promise<void> => {
    const directory = logDirectory();
    await mkdir(directory, { recursive: true });
    await shell.openPath(directory);
  });

  return () => {
    ipcMain.removeHandler(CHANNELS.shellOpenWorkspace);
    ipcMain.removeHandler(CHANNELS.shellOpenLogs);
  };
}
