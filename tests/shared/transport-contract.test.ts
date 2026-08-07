import { describe, expect, it } from 'vitest';
import {
  parseCloseConnectionRequest,
  parseOpenConnectionRequest,
  parseSendConnectionRequest,
} from '@shared/transport/schema.js';

const transport = {
  kind: 'websocket' as const,
  url: 'wss://example.test/socket',
  headers: { Authorization: 'Bearer token' },
  protocols: ['graphql-ws'],
  retry: { enabled: true, attempts: 5, baseMs: 500, maxMs: 8000 },
  keepalive: { enabled: false, intervalMs: 30000, timeoutMs: 10000 },
  verifyCertificate: true,
  maxMessageBytes: 104857600,
};

describe('connection transport command parsing', () => {
  it('accepts discriminated WebSocket open and send commands', () => {
    expect(parseOpenConnectionRequest({ connectionId: 'c1', transport })).toEqual({
      connectionId: 'c1',
      transport,
    });
    const message = { kind: 'websocket' as const, body: '{"event":"ping"}', encoding: 'text' as const };
    expect(parseSendConnectionRequest({ connectionId: 'c1', message })).toEqual({
      connectionId: 'c1',
      message,
    });
  });

  /**
   * A binary frame crosses as base64, so the encoding is part of the command:
   * without it the main process would have to guess how to read the body, and
   * guessing wrong puts different bytes on the wire than the ones asked for.
   */
  it('carries the encoding of the payload and refuses one it does not know', () => {
    expect(
      parseSendConnectionRequest({
        connectionId: 'c1',
        message: { kind: 'websocket', body: 'AAEC', encoding: 'base64' },
      }).message,
    ).toMatchObject({ encoding: 'base64' });

    expect(() =>
      parseSendConnectionRequest({
        connectionId: 'c1',
        message: { kind: 'websocket', body: 'AAEC', encoding: 'hex' },
      }),
    ).toThrow(/send request/);
  });

  it('rejects unknown transport kinds and extra command fields', () => {
    expect(() =>
      parseOpenConnectionRequest({
        connectionId: 'c1',
        transport: { ...transport, kind: 'sse' },
      }),
    ).toThrow(/transport/);
    expect(() => parseCloseConnectionRequest({ connectionId: 'c1', force: true })).toThrow(
      /connection close request/,
    );
  });

  it('rejects header injection and malformed identifiers before main receives them', () => {
    expect(() =>
      parseOpenConnectionRequest({
        connectionId: '../c1',
        transport: { ...transport, headers: { 'X-Trace': 'ok\r\nX-Admin: true' } },
      }),
    ).toThrow(/connection open request/);
  });
});
