import { join } from 'node:path';
import { app, BrowserWindow } from 'electron';
import { CHANNELS } from '@shared/ipc/contract.js';
import { versionArg, welcomeArgs, workbenchArgs } from '@shared/ipc/window-args.js';
import { watchDevToolsShortcut } from './devtools.js';
import { openExternally } from './security/external.js';

/** Both windows open at the reference size; only the workbench may leave it. */
export const WINDOW_SIZE = { width: 1294, height: 807 } as const;

function baseOptions(argv: string[]): Electron.BrowserWindowConstructorOptions {
  return {
    ...WINDOW_SIZE,
    show: false,
    backgroundColor: '#ffffff',
    // The app draws its own chrome. `hidden` rather than `frame: false` so the
    // OS keeps resizing, snapping and the macOS traffic lights.
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 11 },
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      spellcheck: false,
      additionalArguments: [...argv, versionArg(app.getVersion())],
    },
  };
}

/** Shared wiring: nothing navigates away, and Ctrl+Shift+I still opens devtools. */
function prepare(window: BrowserWindow): BrowserWindow {
  window.once('ready-to-show', () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternally(url);
    return { action: 'deny' };
  });

  // The chrome's restore/maximise glyph follows the window, which also changes
  // by dragging to the top edge. The listener belongs here and not to an IPC
  // handler: it is per window, and it dies with the window.
  const publish = (): void => {
    if (!window.isDestroyed()) window.webContents.send(CHANNELS.windowState, window.isMaximized());
  };
  window.on('maximize', publish);
  window.on('unmaximize', publish);

  watchDevToolsShortcut(window.webContents);

  return window;
}

/**
 * Picking a document is its own window: fixed at the reference size, with no
 * minimise and no maximise, so the only control it carries is close.
 */
export function createWelcomeWindow(): BrowserWindow {
  return prepare(
    new BrowserWindow({
      ...baseOptions(welcomeArgs()),
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
    }),
  );
}

/** The editor. The one window that resizes, minimises and maximises. */
export function createWorkbenchWindow(workspaceId: string): BrowserWindow {
  return prepare(
    new BrowserWindow({
      ...baseOptions(workbenchArgs(workspaceId)),
      minWidth: 1024,
      minHeight: 640,
      resizable: true,
      minimizable: true,
      maximizable: true,
    }),
  );
}
