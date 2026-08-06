import type { IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketServer, type WebSocket } from 'ws';
import { DEFAULT_WEBSOCKET_SETTINGS } from '@shared/domain/connections/defaults.js';
import type { ActivityRecord, ConnectionStateEvent } from '@shared/ipc/activity.js';
import type { ResolvedWebSocketTransport } from '@shared/transport/contract.js';
import { base64ToBytes } from '@shared/binary/base64.js';
import { ActivityBuffer } from '../../src/main/connections/activity-buffer.js';
import { ConnectionManager } from '../../src/main/connections/manager.js';
import { nextDelay } from '../../src/main/connections/websocket/backoff.js';
import { frameOf, textFrame } from '../../src/main/connections/websocket/frame.js';
import { startKeepalive } from '../../src/main/connections/websocket/keepalive.js';
import { assertWsUrl } from '../../src/main/connections/websocket/url.js';

/** The defaults, with retry off unless a test is about retry. */
function transport(
  url: string,
  overrides: Partial<ResolvedWebSocketTransport> = {},
): ResolvedWebSocketTransport {
  return {
    kind: 'websocket',
    url,
    headers: {},
    protocols: [],
    retry: { ...DEFAULT_WEBSOCKET_SETTINGS.retry, enabled: false },
    keepalive: { ...DEFAULT_WEBSOCKET_SETTINGS.keepalive },
    verifyCertificate: DEFAULT_WEBSOCKET_SETTINGS.verifyCertificate,
    maxMessageBytes: DEFAULT_WEBSOCKET_SETTINGS.maxMessageBytes,
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

describe('frameOf', () => {
  it('reads a text frame verbatim and weighs it in wire bytes', () => {
    expect(frameOf(Buffer.from('añ', 'utf8'), false)).toEqual({
      body: 'añ',
      encoding: 'text',
      bytes: 3,
    });
  });

  /**
   * The frame used to collapse to `<binario N bytes>`, which threw the payload
   * away at the door: nothing downstream could show it, resend it or export it.
   */
  it('carries a binary frame as base64 instead of collapsing it', () => {
    const bytes = Buffer.from([0x00, 0xff, 0x10]);
    const frame = frameOf(bytes, true);

    expect(frame.encoding).toBe('base64');
    expect(frame.bytes).toBe(3);
    expect(base64ToBytes(frame.body)).toEqual(new Uint8Array(bytes));
  });

  it('joins a fragmented frame before reading it', () => {
    expect(frameOf([Buffer.from('ab'), Buffer.from('cd')], false).body).toBe('abcd');
  });

  it('calls a note what it is: text the app wrote, not a frame', () => {
    expect(textFrame('closed')).toEqual({ body: 'closed', encoding: 'text', bytes: 6 });
  });
});

describe('ActivityBuffer', () => {
  const record = (sequence: number): ActivityRecord => ({
    id: `c1:${String(sequence)}`,
    connectionId: 'c1',
    transportKind: 'websocket',
    sequence,
    kind: 'incoming',
    at: 0,
    label: 'x',
    body: 'x',
    encoding: 'text',
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

    manager = new ConnectionManager({
      state: (event) => ownStates.push(event),
      activity: (record) => ownActivity.push(record),
    });
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

    await manager.open({ connectionId: 'c1', transport: transport(url) });
    expect(states.map((event) => event.state)).toEqual(['connecting', 'open']);

    await manager.send('c1', { kind: 'websocket', text: '{"event":"ping"}' });
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
   * A deleted tab is not a closed socket: nothing will ever observe that
   * connection again, so the session has to go with it. Leaving it in the map
   * kept its resolved target and its reporter alive for the life of the window.
   */
  it('forgets a disposed connection and refuses to send to it', async () => {
    await manager.open({ connectionId: 'c1', transport: transport(url) });
    await vi.waitFor(() => {
      expect(states.at(-1)?.state).toBe('open');
    });

    manager.dispose('c1');

    await expect(manager.send('c1', { kind: 'websocket', text: 'x' })).rejects.toThrow(
      'Connection c1 is not open',
    );
    // The socket is gone too, not only the bookkeeping.
    await vi.waitFor(() => {
      expect(server.clients.size).toBe(0);
    });
  });

  it('reopens a connection that was disposed', async () => {
    await manager.open({ connectionId: 'c1', transport: transport(url) });
    manager.dispose('c1');
    await manager.open({ connectionId: 'c1', transport: transport(url) });
    await vi.waitFor(() => {
      expect(states.at(-1)?.state).toBe('open');
    });
  });

  /**
   * The renderer shows failures in the activity log and nowhere else, so a URL
   * rejected before any socket exists still has to leave a line behind.
   */
  it('rejects a URL that is not ws or wss and records why', async () => {
    await expect(
      manager.open({
        connectionId: 'c1',
        transport: transport('http://127.0.0.1'),
      }),
    ).rejects.toThrow(/ws:/);

    expect(activity).toHaveLength(1);
    expect(activity[0]?.kind).toBe('error');
    expect(activity[0]?.body).toMatch(/ws:/);
  });

  /**
   * `ECONNREFUSED` on its own is not a diagnosis. The code stays because it is
   * what gets searched for, and the sentence around it is what makes the log
   * usable by someone who is not reading Node documentation.
   */
  it('explains a refused connection instead of forwarding the raw code', async () => {
    const closed = new WebSocketServer({ port: 0 });
    const port = (closed.address() as AddressInfo).port;
    await new Promise<void>((resolve) => {
      closed.close(() => {
        resolve();
      });
    });

    await expect(
      manager.open({
        connectionId: 'c1',
        transport: transport(`ws://127.0.0.1:${String(port)}`),
      }),
    ).rejects.toThrow();

    await vi.waitFor(() => {
      expect(activity.some((item) => item.kind === 'error')).toBe(true);
    });
    const failure = activity.find((item) => item.kind === 'error');
    expect(failure?.body).toContain('ECONNREFUSED');
    expect(failure?.body).toContain(`ws://127.0.0.1:${String(port)}`);
    expect(failure?.label).toBe('Error');
  });

  it('refuses to send on a connection that is not open', async () => {
    await expect(
      manager.send('missing', { kind: 'websocket', text: 'x' }),
    ).rejects.toThrow(/not open/);
  });

  it('rejects an oversized outgoing message before it reaches the socket or activity', async () => {
    const received: string[] = [];
    server.on('connection', (socket) => {
      socket.on('message', (data: Buffer) => received.push(data.toString()));
    });
    await manager.open({
      connectionId: 'c1',
      transport: transport(url, { maxMessageBytes: 4 }),
    });

    await expect(
      manager.send('c1', { kind: 'websocket', text: '12345' }),
    ).rejects.toThrow(/4 byte limit/);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(received).toEqual([]);
    expect(activity.filter((item) => item.kind === 'outgoing')).toEqual([]);
  });

  it('closes idempotently and does not reconnect after a manual close', async () => {
    await manager.open({ connectionId: 'c1', transport: transport(url) });
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

    await manager.open({
      connectionId: 'c1',
      transport: transport(url, {
        retry: { enabled: true, baseMs: 5, maxMs: 20, attempts: 3 },
      }),
    });

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
    expect(activity.some((item) => item.label.includes('Retrying'))).toBe(true);
  });

  it('never retries while the policy is off', async () => {
    server.on('connection', (socket) => {
      setTimeout(() => {
        socket.terminate();
      }, 5);
    });

    await manager.open({ connectionId: 'c1', transport: transport(url) });

    await vi.waitFor(() => {
      expect(states.at(-1)?.state).toBe('dropped');
    });
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(activity.some((item) => item.label.includes('Retrying'))).toBe(false);
  });

  it('carries the handshake headers it was given', async () => {
    const handshake = new Promise<IncomingMessage>((resolve) => {
      server.once('connection', (_socket, request) => {
        resolve(request);
      });
    });

    await manager.open({
      connectionId: 'c1',
      transport: transport(url, {
        headers: { Authorization: 'Bearer abc', 'X-Trace': '1' },
      }),
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
      transport: transport(url, { protocols: ['graphql-ws'] }),
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

    await manager.open({
      connectionId: 'c1',
      transport: transport(url, { maxMessageBytes: 1024 }),
    });

    await vi.waitFor(() => {
      expect(activity.some((item) => item.body.includes('Max payload size exceeded'))).toBe(true);
    });
    expect(activity.some((item) => item.kind === 'incoming')).toBe(false);
  });

  /** The bytes the peer sent, all of them, reachable from the log. */
  it('logs an incoming binary frame byte for byte', async () => {
    const payload = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]);
    server.on('connection', (socket) => {
      socket.send(payload, { binary: true });
    });

    await manager.open({ connectionId: 'c1', transport: transport(url) });
    await vi.waitFor(() => {
      expect(activity.filter((item) => item.kind === 'incoming')).toHaveLength(1);
    });

    const frame = activity.find((item) => item.kind === 'incoming');
    expect(frame?.encoding).toBe('base64');
    expect(frame?.bytes).toBe(payload.byteLength);
    expect(base64ToBytes(frame?.body ?? '')).toEqual(new Uint8Array(payload));
    // The label is a hint, not the frame: base64 in the label column says nothing.
    expect(frame?.label).toContain('6');
  });

  it('lets a frame under the ceiling through', async () => {
    server.on('connection', (socket) => {
      socket.send('x'.repeat(512));
    });

    await manager.open({
      connectionId: 'c1',
      transport: transport(url, { maxMessageBytes: 1024 }),
    });

    await vi.waitFor(() => {
      expect(activity.filter((item) => item.kind === 'incoming')).toHaveLength(1);
    });
  });

  it('reopens without letting the old socket overwrite the new lifecycle', async () => {
    let connections = 0;
    server.on('connection', () => {
      connections += 1;
    });

    await manager.open({ connectionId: 'c1', transport: transport(url) });
    await manager.open({ connectionId: 'c1', transport: transport(url) });

    await vi.waitFor(() => {
      expect(connections).toBe(2);
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(states.at(-1)?.state).toBe('open');
  });

  it('settles as closed when the user cancels a pending retry', async () => {
    server.once('connection', (socket) => {
      setTimeout(() => {
        socket.terminate();
      }, 5);
    });
    await manager.open({
      connectionId: 'c1',
      transport: transport(url, {
        retry: { enabled: true, baseMs: 100, maxMs: 100, attempts: 3 },
      }),
    });
    await vi.waitFor(() => {
      expect(states.at(-1)?.state).toBe('dropped');
    });

    manager.close('c1');

    expect(states.at(-1)?.state).toBe('closed');
    await new Promise((resolve) => setTimeout(resolve, 130));
    expect(states.at(-1)?.state).toBe('closed');
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
      off: (event: string) => {
        listeners.delete(event);
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
