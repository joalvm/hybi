import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHANNELS } from '../../src/shared/ipc/contract.js';

/**
 * Channels the main process pushes into the renderer. They travel over
 * `webContents.send`, so they never get an `ipcMain.handle` registration.
 */
const PUSH_ONLY = new Set<string>([CHANNELS.wsState, CHANNELS.wsActivity, CHANNELS.windowState]);

const handlers = new Map<string, unknown>();

vi.mock('electron', () => ({
  app: { getPath: () => 'ignored-in-this-test' },
  dialog: { showOpenDialog: vi.fn() },
  clipboard: { readText: vi.fn(() => ''), writeText: vi.fn() },
  Menu: { buildFromTemplate: vi.fn() },
  BrowserWindow: { fromWebContents: vi.fn(() => null) },
  ipcMain: {
    handle: (channel: string, listener: unknown) => handlers.set(channel, listener),
    removeHandler: (channel: string) => handlers.delete(channel),
  },
}));

const { registerAppIpc, registerWorkbenchIpc } = await import('../../src/main/ipc/register.js');

/** Registration never touches the window; it only closes over it. */
function fakeWindow(): Electron.BrowserWindow {
  return {
    isDestroyed: () => true,
    on: vi.fn(),
    off: vi.fn(),
    isMaximized: () => false,
    webContents: { send: vi.fn() },
  } as unknown as Electron.BrowserWindow;
}

const actions = {
  openWorkspace: vi.fn(),
  menu: () => ({}) as Electron.Menu,
};

describe('IPC registration', () => {
  beforeEach(() => {
    handlers.clear();
  });

  it('answers every request channel the bridge can invoke', () => {
    registerAppIpc(actions);
    registerWorkbenchIpc(fakeWindow());

    const expected = Object.values(CHANNELS).filter((channel) => !PUSH_ONLY.has(channel));
    expect([...handlers.keys()].sort()).toEqual([...expected].sort());
  });

  /**
   * The welcome window opens before any document does, so everything it needs
   * has to be answerable without a workbench window in existence.
   */
  it('serves the welcome window before a workbench window exists', () => {
    registerAppIpc(actions);

    expect([...handlers.keys()].sort()).toEqual(
      [
        CHANNELS.clipboardRead,
        CHANNELS.clipboardWrite,
        CHANNELS.shellOpenWorkspace,
        CHANNELS.windowClose,
        CHANNELS.windowIsMaximized,
        CHANNELS.windowMinimize,
        CHANNELS.windowPopupAppMenu,
        CHANNELS.windowToggleMaximize,
        CHANNELS.workspaceCreate,
        CHANNELS.workspaceDelete,
        CHANNELS.workspaceDuplicate,
        CHANNELS.workspaceList,
        CHANNELS.workspaceLoad,
        CHANNELS.workspaceSave,
      ].sort(),
    );
  });

  /**
   * Opening a second document registers the socket channels again, which
   * `ipcMain.handle` refuses while the first registration is still standing.
   */
  it('frees the workbench channels for the next window', () => {
    registerAppIpc(actions);
    const dispose = registerWorkbenchIpc(fakeWindow());
    dispose();

    expect(handlers.has(CHANNELS.wsOpen)).toBe(false);
    expect(handlers.has(CHANNELS.asyncapiImport)).toBe(false);
    expect(handlers.has(CHANNELS.workspaceList)).toBe(true);
  });

  it('leaves no handler behind once disposed', () => {
    const disposeApp = registerAppIpc(actions);
    const disposeWorkbench = registerWorkbenchIpc(fakeWindow());

    disposeWorkbench();
    disposeApp();

    expect([...handlers.keys()]).toEqual([]);
  });
});
