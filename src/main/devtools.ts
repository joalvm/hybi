import { session, type WebContents } from 'electron';

/** Where a locally unpacked React DevTools build can be pointed at. */
const EXTENSION_PATH_VAR = 'HYBI_REACT_DEVTOOLS';

/** Chrome Web Store id of React Developer Tools. */
const REACT_DEVTOOLS_ID = 'fmkadmapgofadopljbjfkapdkoienihi';

function isToggleDevTools(input: Electron.Input): boolean {
  if (input.type !== 'keyDown') return false;
  if (input.key === 'F12') return true;
  // Ctrl+Shift+I everywhere, and the Cmd+Alt+I macOS users expect.
  const modifier = process.platform === 'darwin' ? input.meta && input.alt : input.control && input.shift;
  return modifier && input.key.toLowerCase() === 'i';
}

/**
 * The application menu is not installed on Windows and Linux — the renderer
 * draws the chrome — so the accelerator that would normally come with it is
 * wired here instead. Without this, Ctrl+Shift+I does nothing in a packaged app.
 */
export function watchDevToolsShortcut(contents: WebContents): void {
  contents.on('before-input-event', (event, input) => {
    if (!isToggleDevTools(input)) return;
    event.preventDefault();
    contents.toggleDevTools();
  });
}

/**
 * Adds the React tab to devtools, so components and hooks are inspectable and
 * not just the DOM. Development only: a packaged build must not reach out to
 * the Chrome Web Store, and never fatal — devtools are a convenience.
 *
 * `HYBI_REACT_DEVTOOLS` loads an unpacked copy from disk instead, which is what
 * an offline machine needs.
 */
export async function installReactDevTools(): Promise<void> {
  const local = process.env[EXTENSION_PATH_VAR];

  try {
    if (local !== undefined && local !== '') {
      await session.defaultSession.extensions.loadExtension(local, { allowFileAccess: true });
      return;
    }

    const { default: install } = await import('electron-devtools-installer');
    await install(REACT_DEVTOOLS_ID, { loadExtensionOptions: { allowFileAccess: true } });
  } catch (error: unknown) {
    console.warn('React DevTools no disponible:', error);
  }
}
