import { BrowserWindow, ipcMain, type Menu } from 'electron';
import { CHANNELS } from '@shared/ipc/contract.js';
import { popupAppMenu } from '../menu.js';

type Anchor = { x: number; y: number };

/**
 * The windows have no native frame, so minimise, maximise, close and the
 * application menu travel the bridge. Every handler resolves its target from
 * the sender instead of taking an id, which keeps one renderer from driving
 * another window.
 *
 * Registered once for the whole app: the handlers are stateless, and the
 * `maximize` push belongs to the window that emits it (see `window.ts`).
 */
export function registerWindowHandlers(menu: () => Menu): () => void {
  ipcMain.handle(CHANNELS.windowMinimize, (event): void => {
    const target = senderWindow(event);
    if (target?.isMinimizable() === true) target.minimize();
  });

  ipcMain.handle(CHANNELS.windowToggleMaximize, (event): void => {
    const target = senderWindow(event);
    // The welcome window is not maximizable, so this is a no-op there even if
    // its renderer ever asks.
    if (target?.isMaximizable() !== true) return;
    if (target.isMaximized()) target.unmaximize();
    else target.maximize();
  });

  ipcMain.handle(CHANNELS.windowClose, (event): void => {
    senderWindow(event)?.close();
  });

  // Read once on mount: a reload can land while the window is already maximised.
  ipcMain.handle(CHANNELS.windowIsMaximized, (event): boolean => {
    return senderWindow(event)?.isMaximized() ?? false;
  });

  ipcMain.handle(CHANNELS.windowPopupAppMenu, (event, anchor: Anchor): void => {
    const target = senderWindow(event);
    if (target !== null) popupAppMenu(menu(), target, anchor);
  });

  return () => {
    ipcMain.removeHandler(CHANNELS.windowMinimize);
    ipcMain.removeHandler(CHANNELS.windowToggleMaximize);
    ipcMain.removeHandler(CHANNELS.windowClose);
    ipcMain.removeHandler(CHANNELS.windowIsMaximized);
    ipcMain.removeHandler(CHANNELS.windowPopupAppMenu);
  };
}

function senderWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}
