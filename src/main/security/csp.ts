/**
 * Content Security Policy for the renderer window.
 *
 * Sockets are owned by the main process, so the page itself never reaches the
 * network and `connect-src 'self'` is enough once packaged. The dev server is
 * the single exception: Vite pushes HMR updates over a WebSocket and
 * `@vitejs/plugin-react` injects its refresh preamble as an inline script.
 * Passing `null` yields the production policy.
 */
export function contentSecurityPolicy(devServerUrl: string | null): string {
  return [
    "default-src 'self'",
    `script-src ${devServerUrl === null ? "'self'" : "'self' 'unsafe-inline'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src ${connectSources(devServerUrl)}`,
  ].join('; ');
}

function connectSources(devServerUrl: string | null): string {
  if (devServerUrl === null) return "'self'";
  return `'self' ${devServerUrl} ${devServerUrl.replace(/^http/, 'ws')}`;
}
