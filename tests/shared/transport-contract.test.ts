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
    expect(
      parseSendConnectionRequest({
        connectionId: 'c1',
        message: { kind: 'websocket', text: '{"event":"ping"}' },
      }),
    ).toEqual({
      connectionId: 'c1',
      message: { kind: 'websocket', text: '{"event":"ping"}' },
    });
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
