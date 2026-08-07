import { describe, expect, it } from 'vitest';
import { diagnose, originOf } from '../../src/main/connections/diagnose.js';

function coded(code: string): Error {
  return Object.assign(new Error('socket hang up'), { code });
}

describe('diagnose', () => {
  it('says what a refused connection means without losing the code', () => {
    const sentence = diagnose(coded('ECONNREFUSED'), 'ws://127.0.0.1:9999/socket');

    expect(sentence).toContain('ECONNREFUSED');
    expect(sentence).toContain('ws://127.0.0.1:9999/socket');
    expect(sentence).not.toBe('socket hang up');
  });

  it('names the host that could not be resolved', () => {
    expect(diagnose(coded('ENOTFOUND'), 'wss://nope.invalid/')).toContain('ENOTFOUND');
  });

  it('groups every certificate rejection under one explanation', () => {
    const expired = diagnose(coded('CERT_HAS_EXPIRED'), 'wss://api.test/');
    const selfSigned = diagnose(coded('DEPTH_ZERO_SELF_SIGNED_CERT'), 'wss://api.test/');

    expect(expired).toContain('CERT_HAS_EXPIRED');
    expect(selfSigned).toContain('DEPTH_ZERO_SELF_SIGNED_CERT');
    expect(expired.replace('CERT_HAS_EXPIRED', '')).toBe(
      selfSigned.replace('DEPTH_ZERO_SELF_SIGNED_CERT', ''),
    );
  });

  /** `ws` reports a handshake that is not 101 as a message, not as a code. */
  it('reads the handshake status out of the message ws throws', () => {
    const sentence = diagnose(new Error('Unexpected server response: 401'), 'wss://api.test/');

    expect(sentence).toContain('401');
    expect(sentence).not.toBe('Unexpected server response: 401');
  });

  it('answers a handshake status it has nothing special to say about', () => {
    expect(diagnose(new Error('Unexpected server response: 503'), 'wss://api.test/')).toContain(
      '503',
    );
  });

  it('falls back to the message of an error it does not recognise', () => {
    expect(diagnose(new Error('something odd'), 'ws://x.test/')).toBe('something odd');
  });

  it('answers something for a thrown value that is not an error', () => {
    expect(diagnose('boom', 'ws://x.test/')).toBe('boom');
  });
});

describe('originOf', () => {
  /** A query string is where a token rides, and this text reaches a file. */
  it('drops the query string and the credentials', () => {
    expect(originOf('wss://user:pass@api.test/socket?token=secret')).toBe('wss://api.test/socket');
  });

  it('leaves a URL it cannot parse alone rather than guessing', () => {
    expect(originOf('not a url')).toBe('not a url');
  });
});
