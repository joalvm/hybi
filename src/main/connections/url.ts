const ALLOWED = new Set(['ws:', 'wss:']);

/** The single gate between renderer input and `new WebSocket(...)`. */
export function assertWsUrl(value: string): URL {
  const url = new URL(value);
  if (!ALLOWED.has(url.protocol)) {
    throw new Error(`Only ws: and wss: URLs are allowed, received ${url.protocol}`);
  }
  return url;
}
