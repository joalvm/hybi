import { shell } from 'electron';

/**
 * Hands a URL to the OS browser, but only for the two schemes a browser is
 * meant to receive. `file:`, `ms-msdt:` and friends would otherwise let a
 * crafted link launch a local handler.
 */
export function openExternally(url: string): void {
  if (url.startsWith('https://') || url.startsWith('http://')) {
    void shell.openExternal(url);
  }
}
