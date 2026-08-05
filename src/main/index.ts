import { app } from 'electron';
import { installReactDevTools } from './devtools.js';
import { registerAppIpc } from './ipc/register.js';
import { buildAppMenu, installAppMenu } from './menu.js';
import { applySecurityPolicy } from './security/policy.js';
import { hasOpenWindow, openWelcome, openWorkspace, showAbout, showPreferences } from './shell.js';
import { openStartupWindow } from './startup.js';

const devServerUrl = process.env.ELECTRON_RENDERER_URL ?? null;

void app.whenReady().then(async () => {
  // macOS shows the menu in its own bar; Windows and Linux get no bar at all —
  // the renderer draws the chrome and reaches this same menu from its button.
  const menu = buildAppMenu({ openWelcome, showAbout, showPreferences });
  installAppMenu(menu);

  applySecurityPolicy(devServerUrl);
  if (devServerUrl !== null) await installReactDevTools();

  registerAppIpc({ openWorkspace, menu: () => menu });
  await openStartupWindow();

  app.on('activate', () => {
    if (!hasOpenWindow()) openWelcome();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
