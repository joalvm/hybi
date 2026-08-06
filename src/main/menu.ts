import { app, Menu, type BrowserWindow, type MenuItemConstructorOptions } from 'electron';
import { format, type Messages } from '@lang/translate.js';
import { mainMessages } from './lang.js';

type Actions = {
  /** Opens another welcome window, the way File ▸ New does in a native app. */
  openWelcome: () => void;
  /** Asks the focused window for its own About dialog. */
  showAbout: () => void;
  /** Same contract as About: the window in front paints the dialog. */
  showPreferences: () => void;
};

type MenuMessages = Messages['menu'];

const PREFERENCES_ACCELERATOR = 'CmdOrCtrl+,';

/** On macOS preferences belong to the app menu, so File only carries them here. */
function fileMenu(actions: Actions, messages: MenuMessages): MenuItemConstructorOptions {
  return {
    label: messages.file,
    submenu: [
      {
        label: messages.newWindow,
        accelerator: 'CmdOrCtrl+Shift+N',
        click: actions.openWelcome,
      },
      ...(process.platform === 'darwin'
        ? []
        : ([
            { type: 'separator' },
            {
              label: messages.preferences,
              accelerator: PREFERENCES_ACCELERATOR,
              click: actions.showPreferences,
            },
          ] satisfies MenuItemConstructorOptions[])),
      { type: 'separator' },
      { role: 'close', label: messages.closeWindow },
      ...(process.platform === 'darwin'
        ? []
        : ([{ role: 'quit', label: messages.quit }] satisfies MenuItemConstructorOptions[])),
    ],
  };
}

/**
 * Clipboard only. `undo`, `redo` and `selectAll` are deliberately absent: their
 * native roles act on the DOM selection, which does nothing to a Monaco model —
 * and on macOS, where this menu is installed, their accelerators would take
 * Ctrl/Cmd+Z and Ctrl/Cmd+A away from the editor that does implement them.
 */
function editMenu(messages: MenuMessages): MenuItemConstructorOptions {
  return {
    label: messages.edit,
    submenu: [
      { role: 'cut', label: messages.cut },
      { role: 'copy', label: messages.copy },
      { role: 'paste', label: messages.paste },
    ],
  };
}

function viewMenu(messages: MenuMessages): MenuItemConstructorOptions {
  return {
    label: messages.view,
    submenu: [
      { role: 'reload', label: messages.reload },
      { role: 'forceReload', label: messages.forceReload },
      // The accelerator is also wired in `devtools.ts`: on Windows and Linux no
      // application menu is installed, so the menu alone would not deliver it.
      { role: 'toggleDevTools', label: messages.devTools },
      { type: 'separator' },
      { role: 'resetZoom', label: messages.resetZoom },
      { role: 'zoomIn', label: messages.zoomIn },
      { role: 'zoomOut', label: messages.zoomOut },
      { type: 'separator' },
      { role: 'togglefullscreen', label: messages.fullscreen },
    ],
  };
}

/**
 * The native panel names Electron and Chromium; the app's own dialog names the
 * version and the phase it is in, which is what someone asking is after.
 */
function helpMenu(actions: Actions, messages: MenuMessages): MenuItemConstructorOptions {
  return {
    label: messages.help,
    submenu: [{ label: format(messages.about, { app: app.name }), click: actions.showAbout }],
  };
}

/** One template behind both the macOS menu bar and the button on the other two. */
export function buildAppMenu(actions: Actions): Menu {
  const messages = mainMessages().menu;
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin'
      ? ([
          {
            label: app.name,
            submenu: [
              { label: format(messages.about, { app: app.name }), click: actions.showAbout },
              { type: 'separator' },
              {
                label: messages.preferences,
                accelerator: PREFERENCES_ACCELERATOR,
                click: actions.showPreferences,
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide', label: format(messages.hide, { app: app.name }) },
              { role: 'hideOthers', label: messages.hideOthers },
              { role: 'unhide', label: messages.unhide },
              { type: 'separator' },
              { role: 'quit', label: format(messages.quitApp, { app: app.name }) },
            ],
          },
        ] satisfies MenuItemConstructorOptions[])
      : []),
    fileMenu(actions, messages),
    editMenu(messages),
    viewMenu(messages),
    helpMenu(actions, messages),
  ];

  return Menu.buildFromTemplate(template);
}

/**
 * macOS owns the menu bar, so the menu is installed there and the button in the
 * chrome is hidden. Windows and Linux get no bar at all — the renderer draws the
 * chrome — and reach the same menu through `popupAppMenu`.
 */
export function installAppMenu(menu: Menu): void {
  Menu.setApplicationMenu(process.platform === 'darwin' ? menu : null);
}

/** Drops the menu under the button that asked, in the window that asked. */
export function popupAppMenu(menu: Menu, window: BrowserWindow, anchor: { x: number; y: number }): void {
  menu.popup({ window, x: Math.round(anchor.x), y: Math.round(anchor.y) });
}
