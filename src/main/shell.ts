import { join } from 'node:path';
import type { BrowserWindow } from 'electron';
import { registerWorkbenchIpc } from './ipc/register.js';
import { guardNavigation } from './security/policy.js';
import { createWelcomeWindow, createWorkbenchWindow } from './window.js';

const devServerUrl = process.env.ELECTRON_RENDERER_URL ?? null;

/**
 * One welcome window and one workbench window, never two of either. Two editors
 * over the same JSON file would overwrite each other's autosave, so opening a
 * document replaces whatever window asked for it.
 */
let welcome: BrowserWindow | null = null;
let workbench: BrowserWindow | null = null;
let disposeWorkbenchIpc: (() => void) | null = null;

function alive(window: BrowserWindow | null): window is BrowserWindow {
  return window !== null && !window.isDestroyed();
}

function load(window: BrowserWindow): void {
  guardNavigation(window.webContents, devServerUrl);

  if (devServerUrl !== null) void window.loadURL(devServerUrl);
  else void window.loadFile(join(import.meta.dirname, '../renderer/index.html'));
}

export function openWelcome(): void {
  if (alive(welcome)) {
    welcome.focus();
    return;
  }

  welcome = createWelcomeWindow();
  welcome.on('closed', () => {
    welcome = null;
  });
  load(welcome);
}

/**
 * Hands a document to the editor. The socket and import channels are torn down
 * before the new window claims them: `ipcMain.handle` refuses a second listener
 * on a channel that is still taken.
 */
export function openWorkspace(workspaceId: string, from: BrowserWindow | null): void {
  if (alive(workbench)) workbench.destroy();
  disposeWorkbenchIpc?.();

  const window = createWorkbenchWindow(workspaceId);
  const dispose = registerWorkbenchIpc(window);
  workbench = window;
  disposeWorkbenchIpc = dispose;

  window.on('closed', () => {
    dispose();
    if (workbench === window) {
      workbench = null;
      disposeWorkbenchIpc = null;
    }
  });

  // The caller stays up until the editor is painted, so the app never blinks
  // through an empty desktop — and `window-all-closed` never fires mid-handover.
  window.once('ready-to-show', () => {
    if (alive(from) && from !== window) from.close();
  });

  load(window);
}

/** True while any window of the app is still on screen. */
export function hasOpenWindow(): boolean {
  return alive(welcome) || alive(workbench);
}
