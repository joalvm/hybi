import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHANNELS } from '../../src/shared/ipc/contract.js';
import { roleOf, welcomeArgs, workbenchArgs, workspaceIdOf } from '../../src/shared/ipc/window-args.js';

type Handler = (event: Electron.IpcMainInvokeEvent, ...args: never[]) => unknown;

const handlers = new Map<string, Handler>();
const fromWebContents = vi.fn<(contents: unknown) => unknown>();
const popup = vi.fn();

vi.mock('electron', () => ({
  BrowserWindow: { fromWebContents: (contents: unknown) => fromWebContents(contents) },
  ipcMain: {
    handle: (channel: string, listener: Handler) => handlers.set(channel, listener),
    removeHandler: (channel: string) => handlers.delete(channel),
  },
}));

vi.mock('../../src/main/menu.js', () => ({
  popupAppMenu: (menu: unknown, window: unknown, anchor: unknown) => {
    popup(menu, window, anchor);
  },
}));

const { registerWindowHandlers } = await import('../../src/main/ipc/window.handlers.js');

function fakeWindow(options: { maximized?: boolean; resizable?: boolean } = {}) {
  const { maximized = false, resizable = true } = options;
  return {
    state: { maximized },
    minimize: vi.fn(),
    maximize: vi.fn(),
    unmaximize: vi.fn(),
    close: vi.fn(),
    isMinimizable: () => resizable,
    isMaximizable: () => resizable,
    isMaximized: vi.fn(function (this: { state: { maximized: boolean } }) {
      return this.state.maximized;
    }),
    isDestroyed: () => false,
  };
}

const menu = {} as Electron.Menu;

const invoke = (channel: string, ...args: unknown[]): unknown =>
  handlers.get(channel)?.(
    { sender: 'contents' } as unknown as Electron.IpcMainInvokeEvent,
    ...(args as never[]),
  );

describe('window handlers', () => {
  beforeEach(() => {
    handlers.clear();
    fromWebContents.mockReset();
    popup.mockReset();
    registerWindowHandlers(() => menu);
  });

  it('acts on the window that sent the message', () => {
    const window = fakeWindow();
    fromWebContents.mockReturnValue(window);

    invoke(CHANNELS.windowMinimize);
    invoke(CHANNELS.windowToggleMaximize);
    invoke(CHANNELS.windowClose);

    expect(window.minimize).toHaveBeenCalledOnce();
    expect(window.maximize).toHaveBeenCalledOnce();
    expect(window.close).toHaveBeenCalledOnce();
    expect(fromWebContents).toHaveBeenCalledWith('contents');
  });

  it('restores instead of maximising when the window is already maximised', () => {
    const window = fakeWindow({ maximized: true });
    fromWebContents.mockReturnValue(window);

    invoke(CHANNELS.windowToggleMaximize);

    expect(window.unmaximize).toHaveBeenCalledOnce();
    expect(window.maximize).not.toHaveBeenCalled();
    expect(invoke(CHANNELS.windowIsMaximized)).toBe(true);
  });

  /** The welcome window is fixed at its size: neither request may reach it. */
  it('refuses to resize or minimise a window that does not allow it', () => {
    const window = fakeWindow({ resizable: false });
    fromWebContents.mockReturnValue(window);

    invoke(CHANNELS.windowMinimize);
    invoke(CHANNELS.windowToggleMaximize);

    expect(window.minimize).not.toHaveBeenCalled();
    expect(window.maximize).not.toHaveBeenCalled();
    expect(window.unmaximize).not.toHaveBeenCalled();
  });

  it('drops the application menu in the window that asked for it', () => {
    const window = fakeWindow();
    fromWebContents.mockReturnValue(window);

    invoke(CHANNELS.windowPopupAppMenu, { x: 8.4, y: 36.6 });

    expect(popup).toHaveBeenCalledWith(menu, window, { x: 8.4, y: 36.6 });
  });

  it('ignores a message whose window is already gone', () => {
    const window = fakeWindow();
    fromWebContents.mockReturnValue(null);

    invoke(CHANNELS.windowClose);
    invoke(CHANNELS.windowPopupAppMenu, { x: 0, y: 0 });

    expect(window.close).not.toHaveBeenCalled();
    expect(popup).not.toHaveBeenCalled();
    expect(invoke(CHANNELS.windowIsMaximized)).toBe(false);
  });

  it('leaves no handler behind once disposed', () => {
    const dispose = registerWindowHandlers(() => menu);
    dispose();

    expect([...handlers.keys()]).toEqual([]);
  });
});

/**
 * Both windows share one renderer bundle, so the role has to survive everything
 * the window can do to itself — a reload above all, which a query string would
 * keep but which devtools users hit constantly.
 */
describe('window role flags', () => {
  it('tells the two windows apart', () => {
    expect(roleOf(welcomeArgs())).toBe('welcome');
    expect(roleOf(workbenchArgs('w1'))).toBe('workbench');
  });

  it('carries the document only into the workbench window', () => {
    expect(workspaceIdOf(workbenchArgs('w1'))).toBe('w1');
    expect(workspaceIdOf(welcomeArgs())).toBeNull();
  });

  /** Chromium prepends its own switches, and none of them may look like a role. */
  it('falls back to welcome when no role flag was passed', () => {
    expect(roleOf(['electron', '--no-sandbox'])).toBe('welcome');
    expect(workspaceIdOf(['electron'])).toBeNull();
  });
});
