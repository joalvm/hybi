import { format } from '@lang/translate.js';
import { mainMessages } from '../../lang.js';

const ALLOWED = new Set(['ws:', 'wss:']);

/** The single gate between untrusted renderer input and `new WebSocket(...)`. */
export function assertWsUrl(value: string): URL {
  const url = new URL(value);
  if (!ALLOWED.has(url.protocol)) {
    throw new Error(
      format(mainMessages().validation.unsupportedScheme, { protocol: url.protocol }),
    );
  }
  return url;
}
