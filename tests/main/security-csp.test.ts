import { describe, expect, it, vi } from 'vitest';
import { contentSecurityPolicy } from '../../src/main/security/csp.js';

type HeadersListener = (
  details: { url: string; responseHeaders: Record<string, string[]> },
  callback: (response: { responseHeaders?: Record<string, string[]> }) => void,
) => void;

let onHeadersReceived: HeadersListener = () => undefined;

vi.mock('electron', () => ({
  session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived: (listener: HeadersListener) => {
          onHeadersReceived = listener;
        },
      },
      setPermissionRequestHandler: vi.fn(),
    },
  },
}));

const { applySecurityPolicy } = await import('../../src/main/security/policy.js');

/** Runs one response through the listener and reports the header it came out with. */
function headerFor(url: string): string[] | undefined {
  let result: Record<string, string[]> | undefined;
  onHeadersReceived({ url, responseHeaders: { 'x-kept': ['yes'] } }, (response) => {
    result = response.responseHeaders;
  });
  return result?.['Content-Security-Policy'];
}

describe('contentSecurityPolicy', () => {
  it('allows nothing but the bundle once packaged', () => {
    const policy = contentSecurityPolicy(null);
    expect(policy).toContain("script-src 'self';");
    expect(policy).toContain("connect-src 'self'");
    expect(policy).not.toContain('unsafe-inline; ');
  });

  it('lets the dev server load modules and push HMR over its socket', () => {
    const policy = contentSecurityPolicy('http://localhost:5173');
    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).toContain("connect-src 'self' http://localhost:5173 ws://localhost:5173");
  });
});

describe('applySecurityPolicy', () => {
  it('constrains the pages the app is served over', () => {
    applySecurityPolicy(null);

    expect(headerFor('file:///app/index.html')).toEqual([contentSecurityPolicy(null)]);
    expect(headerFor('http://localhost:5173/main.tsx')).toEqual([contentSecurityPolicy(null)]);
  });

  /**
   * The listener sees every response in the session, devtools and its extensions
   * included. Rewriting the header there constrains the inspector instead of the
   * app — which is how React DevTools ends up refusing to load its own panel.
   */
  it('leaves devtools and its extensions alone', () => {
    applySecurityPolicy(null);

    expect(headerFor('devtools://devtools/bundled/panel.html')).toBeUndefined();
    expect(headerFor('chrome-extension://fmkadmapgofadopljbjfkapdkoienihi/panel.js')).toBeUndefined();
  });
});
