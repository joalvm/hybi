import type { BrowserWindow, Menu } from 'electron';
import { registerActivityHandlers } from './activity.handlers.js';
import { registerAsyncApiHandlers } from './asyncapi.handlers.js';
import { registerClipboardHandlers } from './clipboard.handlers.js';
import { registerConnectionHandlers } from './connection.handlers.js';
import { registerShellHandlers } from './shell.handlers.js';
import { registerWindowHandlers } from './window.handlers.js';
import { registerWorkspaceHandlers } from './workspace.handlers.js';

type AppActions = {
  openWorkspace: (workspaceId: string, from: BrowserWindow | null) => void;
  menu: () => Menu;
};

/**
 * The channels every window may use. Registered once for the app because each
 * handler either needs no window or resolves one from its sender: registering
 * them per window would make the second window throw on a duplicate channel.
 */
export function registerAppIpc(actions: AppActions): () => void {
  const disposers = [
    registerWorkspaceHandlers(),
    registerClipboardHandlers(),
    registerWindowHandlers(actions.menu),
    registerShellHandlers(actions),
  ];

  return () => {
    for (const dispose of disposers) dispose();
  };
}

/**
 * The channels that only exist while a document is open. Both own a window —
 * sockets push into it, the import dialog is parented to it — so they live and
 * die with the workbench window rather than with the app.
 */
export function registerWorkbenchIpc(window: BrowserWindow): () => void {
  const disposers = [
    registerConnectionHandlers(window),
    registerAsyncApiHandlers(window),
    registerActivityHandlers(window),
  ];

  return () => {
    for (const dispose of disposers) dispose();
  };
}
