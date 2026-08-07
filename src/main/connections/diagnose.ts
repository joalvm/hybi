import { format } from '@lang/translate.js';
import { mainMessages } from '../lang.js';

type Sentence = keyof ReturnType<typeof mainMessages>['exceptions']['network'];

/**
 * Every code Node raises on a socket that never opened, grouped by what the
 * user can do about it: a refused port, a name that does not resolve, a route
 * that does not exist, a certificate that was not accepted. Shared by every
 * transport, because the socket underneath is the same one and so is the
 * sentence the user needs.
 */
const BY_CODE: Record<string, Sentence> = {
  ECONNREFUSED: 'refused',
  ENOTFOUND: 'unknownHost',
  EAI_AGAIN: 'unknownHost',
  ETIMEDOUT: 'timedOut',
  ECONNABORTED: 'timedOut',
  ECONNRESET: 'reset',
  EPIPE: 'reset',
  EHOSTUNREACH: 'unreachable',
  ENETUNREACH: 'unreachable',
  CERT_HAS_EXPIRED: 'certificate',
  DEPTH_ZERO_SELF_SIGNED_CERT: 'certificate',
  SELF_SIGNED_CERT_IN_CHAIN: 'certificate',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'certificate',
  ERR_TLS_CERT_ALTNAME_INVALID: 'certificate',
};

/** What `ws` throws when the handshake answered with anything but 101. */
const UNEXPECTED_RESPONSE = /^Unexpected server response: (\d{3})$/;

function codeOf(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  const code: unknown = (error as NodeJS.ErrnoException).code;
  return typeof code === 'string' ? code : null;
}

function statusOf(error: unknown): number | null {
  if (!(error instanceof Error)) return null;
  const found = UNEXPECTED_RESPONSE.exec(error.message);
  return found === null ? null : Number(found[1]);
}

/**
 * The URL without its query and without its credentials. Both this sentence and
 * the log file it ends up in can be attached to an issue, and a token riding in
 * the query would go with them.
 */
export function originOf(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return url;
  }
}

/**
 * Turns a socket failure into a sentence that says what happened and what to do
 * about it, without dropping the code: `ECONNREFUSED` is what gets searched for
 * and what an issue has to carry. An error this does not know keeps its own
 * message rather than being flattened into a generic one.
 */
export function diagnose(error: unknown, url: string): string {
  const messages = mainMessages().exceptions.network;

  const code = codeOf(error);
  const sentence = code === null ? undefined : BY_CODE[code];
  if (code !== null && sentence !== undefined) {
    return format(messages[sentence], { code, url: originOf(url) });
  }

  const status = statusOf(error);
  if (status !== null) {
    const template =
      status === 401 || status === 403 ? messages.handshakeRejected : messages.handshakeStatus;
    return format(template, { status });
  }

  return error instanceof Error ? error.message : String(error);
}
