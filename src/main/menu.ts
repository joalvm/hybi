import { app, Menu, type BrowserWindow, type MenuItemConstructorOptions } from 'electron';

type Actions = {
  /** Opens another welcome window, the way File ▸ New does in a native app. */
  openWelcome: () => void;
};

function fileMenu(actions: Actions): MenuItemConstructorOptions {
  return {
    label: 'Archivo',
    submenu: [
      {
        label: 'Nueva ventana',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: actions.openWelcome,
      },
      { type: 'separator' },
      { role: 'close', label: 'Cerrar ventana' },
      ...(process.platform === 'darwin'
        ? []
        : ([{ role: 'quit', label: 'Salir' }] satisfies MenuItemConstructorOptions[])),
    ],
  };
}

/**
 * Clipboard only. `undo`, `redo` and `selectAll` are deliberately absent: their
 * native roles act on the DOM selection, which does nothing to a Monaco model —
 * and on macOS, where this menu is installed, their accelerators would take
 * Ctrl/Cmd+Z and Ctrl/Cmd+A away from the editor that does implement them.
 */
const EDIT_MENU: MenuItemConstructorOptions = {
  label: 'Editar',
  submenu: [
    { role: 'cut', label: 'Cortar' },
    { role: 'copy', label: 'Copiar' },
    { role: 'paste', label: 'Pegar' },
  ],
};

const VIEW_MENU: MenuItemConstructorOptions = {
  label: 'Ver',
  submenu: [
    { role: 'reload', label: 'Recargar' },
    { role: 'forceReload', label: 'Forzar recarga' },
    // The accelerator is also wired in `devtools.ts`: on Windows and Linux no
    // application menu is installed, so the menu alone would not deliver it.
    { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
    { type: 'separator' },
    { role: 'resetZoom', label: 'Tamaño original' },
    { role: 'zoomIn', label: 'Acercar' },
    { role: 'zoomOut', label: 'Alejar' },
    { type: 'separator' },
    { role: 'togglefullscreen', label: 'Pantalla completa' },
  ],
};

const HELP_MENU: MenuItemConstructorOptions = {
  label: 'Ayuda',
  submenu: [{ role: 'about', label: `Acerca de ${app.name}` }],
};

/** One template behind both the macOS menu bar and the button on the other two. */
export function buildAppMenu(actions: Actions): Menu {
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin'
      ? ([{ role: 'appMenu' }] satisfies MenuItemConstructorOptions[])
      : []),
    fileMenu(actions),
    EDIT_MENU,
    VIEW_MENU,
    HELP_MENU,
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
