import { BrowserWindow, ipcMain } from 'electron';
import { CHANNELS } from '@shared/ipc/contract.js';
import type { AppPreferences } from '@shared/preferences/types.js';
import { loadPreferences, savePreferences } from '../preferences/service.js';

const PREFERENCES_CHANNELS = [CHANNELS.preferencesLoad, CHANNELS.preferencesSave];

export function registerPreferencesHandlers(): () => void {
  ipcMain.handle(CHANNELS.preferencesLoad, (): Promise<AppPreferences> => loadPreferences());

  ipcMain.handle(
    CHANNELS.preferencesSave,
    async (event, preferences: AppPreferences): Promise<AppPreferences> => {
      const stored = await savePreferences(preferences);

      // The sender already has them. The broadcast exists for the other window:
      // one installation has one theme, whichever window was used to change it.
      for (const window of BrowserWindow.getAllWindows()) {
        if (window.webContents.id === event.sender.id) continue;
        window.webContents.send(CHANNELS.preferencesChanged, stored);
      }

      return stored;
    },
  );

  return () => {
    for (const channel of PREFERENCES_CHANNELS) ipcMain.removeHandler(channel);
  };
}
