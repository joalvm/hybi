import { app } from 'electron';
import { resolveLanguage } from '@shared/preferences/resolve.js';
import { installReactDevTools } from './devtools.js';
import { registerAppIpc } from './ipc/register.js';
import { setMainLanguage } from './lang.js';
import { startAppLog } from './log/index.js';
import { logFile } from './log/paths.js';
import { buildAppMenu, installAppMenu } from './menu.js';
import { loadPreferences, onPreferencesChanged } from './preferences/service.js';
import { applySecurityPolicy } from './security/policy.js';
import { hasOpenWindow, openWelcome, openWorkspace, showAbout, showPreferences } from './shell.js';
import { openStartupWindow } from './startup.js';

const devServerUrl = process.env.ELECTRON_RENDERER_URL ?? null;

void app.whenReady().then(async () => {
  // First of all, so anything that fails from here on leaves a line behind: a
  // report that arrives during the beta is only worth as much as the file the
  // user can attach to it.
  startAppLog(logFile());

  // Before anything that carries a label: the menu, the save dialogs and every
  // error the main process throws read the catalog this decides.
  const preferences = await loadPreferences();
  setMainLanguage(resolveLanguage(preferences.language, app.getLocale()));

  const actions = { openWelcome, showAbout, showPreferences };
  // macOS shows the menu in its own bar; Windows and Linux get no bar at all —
  // the renderer draws the chrome and reaches this same menu from its button.
  let menu = buildAppMenu(actions);
  installAppMenu(menu);

  // A menu is built once from strings, so switching language has to build
  // another one. Rebuilding here rather than asking for a restart.
  onPreferencesChanged((next) => {
    setMainLanguage(resolveLanguage(next.language, app.getLocale()));
    menu = buildAppMenu(actions);
    installAppMenu(menu);
  });

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
