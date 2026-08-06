import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roleOf, versionOf, workspaceIdOf } from '../../src/shared/ipc/window-args.js';

const constructed: Electron.BrowserWindowConstructorOptions[] = [];

class FakeBrowserWindow {
  webContents = { setWindowOpenHandler: vi.fn(), on: vi.fn(), send: vi.fn() };

  constructor(options: Electron.BrowserWindowConstructorOptions) {
    constructed.push(options);
  }

  once = vi.fn();
  on = vi.fn();
  isDestroyed = () => false;
  isMaximized = () => false;
}

vi.mock('electron', () => ({
  app: { getVersion: () => '9.9.9', getLocale: () => 'es-PE' },
  BrowserWindow: FakeBrowserWindow,
  shell: { openExternal: vi.fn() },
  session: { defaultSession: { extensions: { loadExtension: vi.fn() } } },
}));

const { createWelcomeWindow, createWorkbenchWindow, WINDOW_SIZE } = await import(
  '../../src/main/window.js'
);

const last = (): Electron.BrowserWindowConstructorOptions => {
  const options = constructed.at(-1);
  if (options === undefined) throw new Error('no window was constructed');
  return options;
};

describe('window sizes and controls', () => {
  beforeEach(() => {
    constructed.length = 0;
  });

  it('opens both windows at the reference size', () => {
    createWelcomeWindow();
    expect(last()).toMatchObject({ width: 1294, height: 807 });

    createWorkbenchWindow('w1');
    expect(last()).toMatchObject({ width: 1294, height: 807 });

    expect(WINDOW_SIZE).toEqual({ width: 1294, height: 807 });
  });

  /** Welcome is a fixed card: close is the only control it can offer. */
  it('pins the welcome window and takes away minimise and maximise', () => {
    createWelcomeWindow();

    expect(last()).toMatchObject({
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
    });
  });

  it('lets only the workbench window resize, minimise and maximise', () => {
    createWorkbenchWindow('w1');

    expect(last()).toMatchObject({ resizable: true, minimizable: true, maximizable: true });
  });

  it('tells each renderer which window it is and which document it holds', () => {
    createWelcomeWindow();
    const welcome = last().webPreferences?.additionalArguments ?? [];

    createWorkbenchWindow('w1');
    const workbench = last().webPreferences?.additionalArguments ?? [];

    expect(roleOf(welcome)).toBe('welcome');
    expect(workspaceIdOf(welcome)).toBeNull();
    expect(roleOf(workbench)).toBe('workbench');
    expect(workspaceIdOf(workbench)).toBe('w1');
  });

  /** The About dialog names a version, and the sandboxed preload cannot ask for it. */
  it('tells both renderers which version they are running', () => {
    createWelcomeWindow();
    expect(versionOf(last().webPreferences?.additionalArguments ?? [])).toBe('9.9.9');

    createWorkbenchWindow('w1');
    expect(versionOf(last().webPreferences?.additionalArguments ?? [])).toBe('9.9.9');
  });


  it('keeps the renderer sandboxed and isolated in both windows', () => {
    createWelcomeWindow();
    createWorkbenchWindow('w1');

    for (const options of constructed) {
      expect(options.webPreferences).toMatchObject({
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webviewTag: false,
      });
    }
  });
});
