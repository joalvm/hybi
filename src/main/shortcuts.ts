import type { WebContents } from 'electron';

function isOpenPreferences(input: Electron.Input): boolean {
  if (input.type !== 'keyDown') return false;
  if (input.shift || input.alt || input.meta) return false;
  return input.control && input.key === ',';
}

/**
 * The application menu is not installed on Windows and Linux — the renderer
 * draws the chrome — so the accelerator that would normally come with it is
 * wired here instead, the same way `watchDevToolsShortcut` does.
 *
 * macOS is left alone on purpose: the menu bar is real there, so Cmd+, already
 * arrives through it and a second listener would open the dialog twice.
 */
export function watchPreferencesShortcut(contents: WebContents, open: () => void): void {
  if (process.platform === 'darwin') return;

  contents.on('before-input-event', (event, input) => {
    if (!isOpenPreferences(input)) return;
    event.preventDefault();
    open();
  });
}
