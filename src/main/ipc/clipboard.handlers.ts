import { clipboard, ipcMain } from 'electron';
import { CHANNELS } from '@shared/ipc/contract.js';

/**
 * The renderer cannot reach the system clipboard: every permission request it
 * makes is denied in `security/policy.ts`, which is the policy we want. Copy and
 * paste therefore travel the same road as every other capability — two channels,
 * both of them text only.
 */
export function registerClipboardHandlers(): () => void {
  ipcMain.handle(CHANNELS.clipboardRead, (): string => clipboard.readText());

  ipcMain.handle(CHANNELS.clipboardWrite, (_event, text: string): void => {
    clipboard.writeText(text);
  });

  return () => {
    ipcMain.removeHandler(CHANNELS.clipboardRead);
    ipcMain.removeHandler(CHANNELS.clipboardWrite);
  };
}
