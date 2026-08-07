import { describe, expect, it } from 'vitest';
import { DEFAULT_SOCKETIO_SETTINGS } from '@shared/domain/connections/defaults.js';
import { socketIoTransportSchema } from '@shared/domain/connections/socketio-schema.js';
import {
  resolvedSocketIoTransportSchema,
  socketIoTransportMessageSchema,
} from '@shared/transport/socketio-schema.js';

const transport = {
  kind: 'socketio',
  url: 'http://127.0.0.1:3000',
  settings: DEFAULT_SOCKETIO_SETTINGS,
};

const resolved = {
  kind: 'socketio',
  url: 'http://127.0.0.1:3000',
  namespace: '/chat',
  path: '/socket.io',
  auth: { token: 'abc' },
  headers: {},
  transports: ['websocket'],
  retry: { enabled: true, attempts: 5, baseMs: 500, maxMs: 8000 },
  ackTimeoutMs: 10000,
  verifyCertificate: true,
  maxMessageBytes: 104857600,
};

describe('persisted Socket.IO transport', () => {
  it('accepts the defaults every new connection starts from', () => {
    expect(socketIoTransportSchema.safeParse(transport).success).toBe(true);
  });

  it('refuses a namespace that is not a path', () => {
    const settings = { ...DEFAULT_SOCKETIO_SETTINGS, namespace: 'chat' };
    expect(socketIoTransportSchema.safeParse({ ...transport, settings }).success).toBe(false);
  });

  it('refuses an empty transport list, which can never connect', () => {
    const settings = { ...DEFAULT_SOCKETIO_SETTINGS, transports: [] };
    expect(socketIoTransportSchema.safeParse({ ...transport, settings }).success).toBe(false);
  });
});

describe('resolved Socket.IO transport', () => {
  it('accepts a resolved target', () => {
    expect(resolvedSocketIoTransportSchema.safeParse(resolved).success).toBe(true);
  });

  it('refuses an engine transport it does not know', () => {
    const wrong = { ...resolved, transports: ['carrier-pigeon'] };
    expect(resolvedSocketIoTransportSchema.safeParse(wrong).success).toBe(false);
  });

  it('refuses an auth value that is not text, so nothing unserializable crosses', () => {
    const wrong = { ...resolved, auth: { token: { nested: true } } };
    expect(resolvedSocketIoTransportSchema.safeParse(wrong).success).toBe(false);
  });
});

describe('Socket.IO message', () => {
  const message = { kind: 'socketio', event: 'chat', body: '"hi"', encoding: 'text', ack: false };

  it('accepts a named event with its single argument', () => {
    expect(socketIoTransportMessageSchema.safeParse(message).success).toBe(true);
  });

  it('refuses an event without a name: the server has nothing to route on', () => {
    expect(socketIoTransportMessageSchema.safeParse({ ...message, event: '' }).success).toBe(false);
  });

  it('carries the encoding, so bytes are not guessed from the body', () => {
    const binary = { ...message, body: 'QUJD', encoding: 'base64' };
    expect(socketIoTransportMessageSchema.safeParse(binary).success).toBe(true);
    expect(socketIoTransportMessageSchema.safeParse({ ...message, encoding: 'hex' }).success).toBe(
      false,
    );
  });
});
