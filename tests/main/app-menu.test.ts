import { beforeEach, describe, expect, it, vi } from 'vitest';

type Template = Electron.MenuItemConstructorOptions[];

const built: Template[] = [];
const setApplicationMenu = vi.fn();
const popup = vi.fn();

vi.mock('electron', () => ({
  app: { name: 'Hybi' },
  Menu: {
    buildFromTemplate: (template: Template) => {
      built.push(template);
      return { popup } as unknown as Electron.Menu;
    },
    setApplicationMenu,
  },
}));

const { buildAppMenu, installAppMenu, popupAppMenu } = await import('../../src/main/menu.js');

const openWelcome = vi.fn();
const showAbout = vi.fn();
const showPreferences = vi.fn();
const actions = { openWelcome, showAbout, showPreferences };

const labels = (template: Template): string[] =>
  template.map((entry) => entry.label ?? String(entry.role));

const submenuRoles = (template: Template, label: string): string[] => {
  const submenu = template.find((entry) => entry.label === label)?.submenu;
  if (!Array.isArray(submenu)) throw new Error(`no submenu for ${label}`);
  return submenu.map((entry) => entry.role ?? entry.type ?? entry.label ?? '');
};

describe('application menu', () => {
  beforeEach(() => {
    built.length = 0;
    setApplicationMenu.mockClear();
    popup.mockClear();
    openWelcome.mockClear();
    showAbout.mockClear();
    showPreferences.mockClear();
  });

  it('carries the four blocks the button opens', () => {
    buildAppMenu(actions);

    expect(labels(built[0] ?? [])).toEqual(
      expect.arrayContaining(['File', 'Edit', 'View', 'Help']),
    );
  });

  /** Devtools has to stay reachable now that no menu bar is drawn. */
  it('keeps devtools in the View menu', () => {
    buildAppMenu(actions);

    expect(submenuRoles(built[0] ?? [], 'View')).toContain('toggleDevTools');
  });

  /** The native panel names Electron and Chromium, not the phase this app is in. */
  it('opens the app dialog from Help instead of the native panel', () => {
    buildAppMenu(actions);
    const help = built[0]?.find((entry) => entry.label === 'Help')?.submenu;
    if (!Array.isArray(help)) throw new Error('no Help submenu');

    expect(help.map((entry) => entry.role)).not.toContain('about');
    help
      .find((entry) => entry.label === 'About Hybi')
      ?.click?.({} as Electron.MenuItem, undefined, {});

    expect(showAbout).toHaveBeenCalledOnce();
  });

  /**
   * The native `undo`, `redo` and `selectAll` roles act on the DOM selection,
   * which does nothing to a Monaco model — and on macOS their accelerators
   * would take the keystrokes away from the editor that does implement them.
   */
  it('leaves undo, redo and select-all to the editor', () => {
    buildAppMenu(actions);
    const roles = submenuRoles(built[0] ?? [], 'Edit');

    expect(roles).toEqual(['cut', 'copy', 'paste']);
  });

  it('opens a welcome window from File', () => {
    buildAppMenu(actions);
    const file = built[0]?.find((entry) => entry.label === 'File')?.submenu;
    if (!Array.isArray(file)) throw new Error('no File submenu');

    file.find((entry) => entry.label === 'New window')?.click?.({} as Electron.MenuItem, undefined, {});

    expect(openWelcome).toHaveBeenCalledOnce();
  });

  /**
   * Preferences are reachable with no chrome control of their own, and from the
   * block the host puts them in: the app menu on macOS, File everywhere else.
   */
  it('opens preferences from the block its platform expects', () => {
    buildAppMenu(actions);
    const owner = process.platform === 'darwin' ? 'Hybi' : 'File';
    const submenu = built[0]?.find((entry) => entry.label === owner)?.submenu;
    if (!Array.isArray(submenu)) throw new Error(`no ${owner} submenu`);

    const item = submenu.find((entry) => entry.label === 'Preferences…');
    expect(item?.accelerator).toBe('CmdOrCtrl+,');
    item?.click?.({} as Electron.MenuItem, undefined, {});

    expect(showPreferences).toHaveBeenCalledOnce();
  });

  /**
   * Windows and Linux draw their own chrome, so installing a menu there would
   * put a bar back above it. macOS has no such option: the bar is the system's.
   */
  it('installs the bar only on macOS', () => {
    const menu = buildAppMenu(actions);
    installAppMenu(menu);

    expect(setApplicationMenu).toHaveBeenCalledWith(process.platform === 'darwin' ? menu : null);
  });

  it('anchors the popup to whole pixels in the window that asked', () => {
    const menu = buildAppMenu(actions);
    const window = {} as Electron.BrowserWindow;

    popupAppMenu(menu, window, { x: 8.4, y: 36.6 });

    expect(popup).toHaveBeenCalledWith({ window, x: 8, y: 37 });
  });
});
