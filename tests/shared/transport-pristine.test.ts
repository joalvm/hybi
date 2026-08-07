import { describe, expect, it } from 'vitest';
import {
  createSocketIoTransport,
  createWebSocketTransport,
} from '@shared/domain/connections/factory.js';
import { isTransportPristine } from '@shared/domain/connections/pristine.js';

describe('isTransportPristine', () => {
  it('holds for a transport straight out of the factory', () => {
    expect(isTransportPristine(createWebSocketTransport())).toBe(true);
    expect(isTransportPristine(createSocketIoTransport())).toBe(true);
  });

  it('fails once the URL was written', () => {
    expect(isTransportPristine({ ...createWebSocketTransport(), url: 'wss://example.test' })).toBe(
      false,
    );
    expect(isTransportPristine({ ...createSocketIoTransport(), url: 'https://example.test' })).toBe(
      false,
    );
  });

  it('fails on a setting changed however deep', () => {
    const websocket = createWebSocketTransport();
    websocket.settings.retry.attempts = 3;
    expect(isTransportPristine(websocket)).toBe(false);

    const socketio = createSocketIoTransport();
    socketio.settings.namespace = '/chat';
    expect(isTransportPristine(socketio)).toBe(false);
  });

  // A header with nothing in it is still something the user typed into the
  // form, and it is still lost when the transport is replaced.
  it('fails on an empty header row that was added by hand', () => {
    const transport = createWebSocketTransport();
    transport.settings.headers.push({ name: '', value: '', enabled: true });
    expect(isTransportPristine(transport)).toBe(false);
  });

  // A workspace read back from disk is rebuilt property by property, and the
  // order that produces is not the factory's. It must not decide the answer.
  it('ignores the order the stored object was written in', () => {
    const transport = createWebSocketTransport();
    const shuffled = {
      settings: { ...transport.settings },
      url: transport.url,
      kind: transport.kind,
    };
    expect(isTransportPristine(shuffled)).toBe(true);
  });
});
