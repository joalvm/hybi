import type { IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketServer, type WebSocket } from 'ws';
import { DEFAULT_CONNECTION_SETTINGS } from '@shared/domain/defaults.js';
import type { ActivityRecord, ConnectionStateEvent } from '@shared/ipc/activity.js';
import type { SocketOptions } from '@shared/ipc/contract.js';
import { ActivityBuffer } from '../../src/main/connections/activity-buffer.js';
import { nextDelay } from '../../src/main/connections/backoff.js';
import { startKeepalive } from '../../src/main/connections/keepalive.js';
import { ConnectionManager } from '../../src/main/connections/manager.js';
import { assertWsUrl } from '../../src/main/connections/url.js';

/** The defaults, with retry off unless a test is about retry. */
function options(overrides: Partial<SocketOptions> = {}): SocketOptions {
  return {
    headers: {},
    protocols: [],
    retry: { ...DEFAULT_CONNECTION_SETTINGS.retry, enabled: false },
    keepalive: { ...DEFAULT_CONNECTION_SETTINGS.keepalive },
    verifyCertificate: DEFAULT_CONNECTION_SETTINGS.verifyCertificate,
    maxMessageBytes: DEFAULT_CONNECTION_SETTINGS.maxMessageBytes,
    ...overrides,
  };
}

describe('assertWsUrl', () => {
  it('accepts ws and wss', () => {
    expect(assertWsUrl('ws://127.0.0.1:3000').protocol).toBe('ws:');
    expect(assertWsUrl('wss://example.test').protocol).toBe('wss:');
  });

  it('rejects every other protocol', () => {
    expect(() => assertWsUrl('http://127.0.0.1')).toThrow(/ws:/);
    expect(() => assertWsUrl('file:///etc/passwd')).toThrow(/ws:/);
    expect(() => assertWsUrl('not a url')).toThrow();
  });
});

describe('nextDelay', () => {
  it('grows exponentially and clamps at the ceiling', () => {
    const random = () => 0;
    expect(nextDelay(0, { baseMs: 500, maxMs: 8000, random })).toBe(500);
    expect(nextDelay(1, { baseMs: 500, maxMs: 8000, random })).toBe(1000);
    expect(nextDelay(9, { baseMs: 500, maxMs: 8000, random })).toBe(8000);
  });

  it('adds jitter below 25 percent', () => {
    const delay = nextDelay(1, { baseMs: 500, maxMs: 8000, random: () => 1 });
    expect(delay).toBeGreaterThan(1000);
    expect(delay).toBeLessThanOrEqual(1250);
  });
});

describe('ActivityBuffer', () => {
  const record = (sequence: number): ActivityRecord => ({
    id: `c1:${String(sequence)}`,
    connectionId: 'c1',
    sequence,
    kind: 'incoming',
    at: 0,
    label: 'x',
    body: 'x',
    bytes: 1,
  });

  it('coalesces records into a single flush', async () => {
    const batches: ActivityRecord[][] = [];
    const buffer = new ActivityBuffer((records) => batches.push(records), 5);

    buffer.push(record(1));
    buffer.push(record(2));
    buffer.push(record(3));
    expect(batches).toHaveLength(0);

    await vi.waitFor(() => {
      expect(batches).toHaveLength(1);
    });
    expect(batches[0]).toHaveLength(3);
    buffer.dispose();
  });

  it('drops pending records on dispose', async () => {
    const batches: ActivityRecord[][] = [];
    const buffer = new ActivityBuffer((records) => batches.push(records), 5);
    buffer.push(record(1));
    buffer.dispose();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(batches).toHaveLength(0);
  });
});

describe('ConnectionManager', () => {
  let server: WebSocketServer;
  let url: string;
  let states: ConnectionStateEvent[];
  let activity: ActivityRecord[];
  let manager: ConnectionManager;

  beforeEach(async () => {
    server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    await new Promise((resolve) => server.once('listening', resolve));
    url = `ws://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
    // Bind the arrays locally: a socket closing after its test finished would
    // otherwise push into whichever array the shared binding points at now.
    const ownStates: ConnectionStateEvent[] = [];
    const ownActivity: ActivityRecord[] = [];
    states = ownStates;
    activity = ownActivity;

    manager = new ConnectionManager(
      {
        state: (event) => ownStates.push(event),
        activity: (record) => ownActivity.push(record),
      },
      { baseMs: 5, maxMs: 20, attempts: 3 },
    );
  });

  afterEach(async () => {
    manager.disposeAll();
    for (const client of server.clients) client.terminate();
    await new Promise((resolve) => { server.close(resolve); });
  });

  it('reaches open, echoes a message and records both directions', async () => {
    server.on('connection', (socket) => {
      socket.on('message', (data: Buffer) => {
        socket.send(`echo:${data.toString()}`);
      });
    });

    await manager.open({ connectionId: 'c1', url });
    expect(states.map((event) => event.state)).toEqual(['connecting', 'open']);

    manager.send('c1', '{"event":"ping"}');
    await vi.waitFor(() => {
      expect(activity.filter((item) => item.kind === 'incoming')).toHaveLength(1);
    });

    expect(activity.map((item) => item.kind)).toEqual(['outgoing', 'incoming']);
    expect(activity[0]?.label).toBe('ping');
    expect(activity[0]?.sequence).toBe(1);
    expect(activity[1]?.body).toBe('echo:{"event":"ping"}');
    expect(activity[1]?.sequence).toBe(2);
  });

  /**
   * The renderer shows failures in the activity log and nowhere else, so a URL
   * rejected before any socket exists still has to leave a line behind.
   */
  it('rejects a URL that is not ws or wss and records why', async () => {
    await expect(manager.open({ connectionId: 'c1', url: 'http://127.0.0.1' })).rejects.toThrow(
      /ws:/,
    );

    expect(activity).toHaveLength(1);
    expect(activity[0]?.kind).toBe('error');
    expect(activity[0]?.body).toMatch(/ws:/);
  });

  it('refuses to send on a connection that is not open', () => {
    expect(() => manager.send('missing', 'x')).toThrow(/not open/);
  });

  it('closes idempotently and does not reconnect after a manual close', async () => {
    await manager.open({ connectionId: 'c1', url });
    manager.close('c1');
    manager.close('c1');

    await vi.waitFor(() => {
      expect(states.at(-1)?.state).toBe('closed');
    });
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(states.map((event) => event.state)).toEqual(['connecting', 'open', 'closing', 'closed']);
  });

  /** `dropped`, not `closed`: the renderer only warns about closes it did not ask for. */
  it('reconnects after the server drops an established connection', async () => {
    let seen = 0;
    server.on('connection', (socket) => {
      seen += 1;
      if (seen === 1) setTimeout(() => { socket.terminate(); }, 5);
    });

    await manager.open({ connectionId: 'c1', url });

    await vi.waitFor(
      () => {
        expect(states.map((event) => event.state)).toEqual([
          'connecting',
          'open',
          'dropped',
          'connecting',
          'open',
        ]);
      },
      { timeout: 3000 },
    );
    expect(activity.some((item) => item.label.includes('Reintentando'))).toBe(true);
  });

  it('never retries while the policy is off', async () => {
    server.on('connection', (socket) => {
      setTimeout(() => {
        socket.terminate();
      }, 5);
    });

    await manager.open({ connectionId: 'c1', url, options: options() });

    await vi.waitFor(() => {
      expect(states.at(-1)?.state).toBe('dropped');
    });
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(activity.some((item) => item.label.includes('Reintentando'))).toBe(false);
  });

  it('carries the handshake headers it was given', async () => {
    const handshake = new Promise<IncomingMessage>((resolve) => {
      server.once('connection', (_socket, request) => {
        resolve(request);
      });
    });

    await manager.open({
      connectionId: 'c1',
      url,
      options: options({ headers: { Authorization: 'Bearer abc', 'X-Trace': '1' } }),
    });

    const request = await handshake;
    expect(request.headers.authorization).toBe('Bearer abc');
    expect(request.headers['x-trace']).toBe('1');
  });

  it('negotiates the subprotocol it was given', async () => {
    const negotiated = new Promise<string>((resolve) => {
      server.once('connection', (socket) => {
        resolve(socket.protocol);
      });
    });

    await manager.open({
      connectionId: 'c1',
      url,
      options: options({ protocols: ['graphql-ws'] }),
    });

    expect(await negotiated).toBe('graphql-ws');
  });

  /**
   * The ceiling is enforced by closing, not by truncating: `ws` sends 1009 to
   * the peer and tears the socket down, so what this side sees is the error and
   * an abnormal close. The oversized frame never reaches the activity log.
   */
  it('drops the connection when the peer sends more than the ceiling allows', async () => {
    server.on('connection', (socket) => {
      socket.send('x'.repeat(4096));
    });

    await manager.open({ connectionId: 'c1', url, options: options({ maxMessageBytes: 1024 }) });

    await vi.waitFor(() => {
      expect(activity.some((item) => item.body.includes('Max payload size exceeded'))).toBe(true);
    });
    expect(activity.some((item) => item.kind === 'incoming')).toBe(false);
  });

  it('lets a frame under the ceiling through', async () => {
    server.on('connection', (socket) => {
      socket.send('x'.repeat(512));
    });

    await manager.open({ connectionId: 'c1', url, options: options({ maxMessageBytes: 1024 }) });

    await vi.waitFor(() => {
      expect(activity.filter((item) => item.kind === 'incoming')).toHaveLength(1);
    });
  });
});

describe('startKeepalive', () => {
  function fake() {
    const listeners = new Map<string, () => void>();
    const calls = { ping: 0, terminate: 0 };
    const socket = {
      ping: () => {
        calls.ping += 1;
      },
      terminate: () => {
        calls.terminate += 1;
      },
      on: (event: string, listener: () => void) => {
        listeners.set(event, listener);
      },
    };
    return {
      socket: socket as unknown as WebSocket,
      calls,
      pong: () => {
        listeners.get('pong')?.();
      },
    };
  }

  it('stays out of the way while disabled', async () => {
    const { socket, calls } = fake();
    const stop = startKeepalive(socket, { enabled: false, intervalMs: 1, timeoutMs: 1 });
    await new Promise((resolve) => setTimeout(resolve, 20));
    stop();
    expect(calls.ping).toBe(0);
  });

  /**
   * A deadline far past the interval, so the count is not a race: while a ping
   * is outstanding nothing else is due, and the second ping can only come from
   * the pong having cleared it.
   */
  it('pings again once the peer answers, and not before', async () => {
    const { socket, calls, pong } = fake();
    const stop = startKeepalive(socket, { enabled: true, intervalMs: 5, timeoutMs: 60000 });

    await vi.waitFor(() => {
      expect(calls.ping).toBeGreaterThanOrEqual(1);
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(calls.ping).toBe(1);

    pong();
    await vi.waitFor(() => {
      expect(calls.ping).toBe(2);
    });
    stop();
  });

  it('terminates a socket that stops answering', async () => {
    const { socket, calls } = fake();
    const stop = startKeepalive(socket, { enabled: true, intervalMs: 5, timeoutMs: 15 });

    await vi.waitFor(() => {
      expect(calls.terminate).toBeGreaterThanOrEqual(1);
    });
    stop();
  });

  it('stops pinging once released', async () => {
    const { socket, calls } = fake();
    const stop = startKeepalive(socket, { enabled: true, intervalMs: 5, timeoutMs: 60000 });
    await vi.waitFor(() => {
      expect(calls.ping).toBeGreaterThanOrEqual(1);
    });
    stop();
    const seen = calls.ping;

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(calls.ping).toBe(seen);
    expect(calls.terminate).toBe(0);
  });
});
