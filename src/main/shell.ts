import { join } from 'node:path';
import { BrowserWindow } from 'electron';
import { CHANNELS } from '@shared/ipc/contract.js';
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
  // The outgoing window stops being the owner before it is told to go, so its
  // own `closed` handler knows it no longer holds the channels.
  const previous = workbench;
  workbench = null;
  disposeWorkbenchIpc?.();
  disposeWorkbenchIpc = null;
  if (alive(previous)) previous.destroy();

  const window = createWorkbenchWindow(workspaceId);
  const dispose = registerWorkbenchIpc(window);
  workbench = window;
  disposeWorkbenchIpc = dispose;

  // Guarded on ownership: `destroy` above may deliver `closed` after the next
  // window has already claimed the channels, and an unconditional `dispose()`
  // would then remove the live handlers instead of the dead ones — leaving the
  // new workbench with no socket IPC at all.
  window.on('closed', () => {
    if (workbench !== window) return;
    dispose();
    workbench = null;
    disposeWorkbenchIpc = null;
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

/**
 * The Help menu belongs to whichever window is in front, so the request goes to
 * the focused one — on macOS a single menu bar serves both windows.
 */
export function showAbout(): void {
  const target = BrowserWindow.getFocusedWindow() ?? (alive(workbench) ? workbench : welcome);
  if (alive(target)) target.webContents.send(CHANNELS.appAbout);
}
