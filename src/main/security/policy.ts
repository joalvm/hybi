import { session } from 'electron';
import { contentSecurityPolicy } from './csp.js';
import { openExternally } from './external.js';

/**
 * Schemes the app itself is served over. The policy exists to constrain the
 * renderer, and `onHeadersReceived` sees every response in the session —
 * including `devtools://` and the `chrome-extension://` resources React
 * DevTools is made of. Rewriting the header on those constrains the inspector
 * rather than the app, and breaks it.
 */
const APP_SCHEMES = new Set(['http:', 'https:', 'file:']);

function servesTheApp(url: string): boolean {
  try {
    return APP_SCHEMES.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

/** Sends the CSP as a header so it also covers what the dev server serves. */
export function applySecurityPolicy(devServerUrl: string | null): void {
  const policy = contentSecurityPolicy(devServerUrl);

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // No `responseHeaders` at all: the response passes through untouched.
    if (!servesTheApp(details.url)) {
      callback({});
      return;
    }

    callback({
      responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [policy] },
    });
  });

  // Nothing here needs camera, microphone, notifications or geolocation.
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => {
    callback(false);
  });
}

/**
 * The window only ever shows the app. Anything else leaves for the OS browser,
 * so a stray link cannot replace the renderer with a foreign page.
 */
export function guardNavigation(
  contents: Electron.WebContents,
  allowedOrigin: string | null,
): void {
  contents.on('will-navigate', (event, url) => {
    if (allowedOrigin !== null && url.startsWith(allowedOrigin)) return;
    event.preventDefault();
    openExternally(url);
  });
}
