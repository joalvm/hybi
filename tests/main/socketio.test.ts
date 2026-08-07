import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { Server, type Socket } from 'socket.io';
import { bytesToBase64 } from '@shared/binary/base64.js';
import { DEFAULT_SOCKETIO_SETTINGS } from '@shared/domain/connections/defaults.js';
import type { ActivityRecord, ConnectionState } from '@shared/ipc/activity.js';
import type { ResolvedSocketIoTransport } from '@shared/transport/socketio.js';
import { SocketIoTransportSession } from '../../src/main/connections/socketio/session.js';
import { assertHttpUrl } from '../../src/main/connections/socketio/url.js';

type Harness = {
  url: string;
  io: Server;
  http: HttpServer;
};

const started: Harness[] = [];

/** A real Socket.IO server, because a fake one cannot fail the way one does. */
async function startServer(namespace = '/'): Promise<Harness & { of: ReturnType<Server['of']> }> {
  const http = createServer();
  const io = new Server(http, { path: '/socket.io' });
  await new Promise<void>((resolve) => {
    http.listen(0, '127.0.0.1', resolve);
  });
  const { port } = http.address() as AddressInfo;
  const harness = { url: `http://127.0.0.1:${String(port)}`, io, http };
  started.push(harness);
  return { ...harness, of: io.of(namespace) };
}

afterEach(async () => {
  const running = started.splice(0, started.length);
  for (const harness of running) {
    harness.io.disconnectSockets(true);
    await harness.io.close();
  }
});

function target(url: string, overrides: Partial<ResolvedSocketIoTransport> = {}): ResolvedSocketIoTransport {
  return {
    kind: 'socketio',
    url,
    namespace: '/',
    path: DEFAULT_SOCKETIO_SETTINGS.path,
    auth: {},
    headers: {},
    transports: ['websocket'],
    retry: { ...DEFAULT_SOCKETIO_SETTINGS.retry, enabled: false },
    ackTimeoutMs: 2000,
    verifyCertificate: true,
    maxMessageBytes: DEFAULT_SOCKETIO_SETTINGS.maxMessageBytes,
    ...overrides,
  };
}

/** Collects everything a session reports, so a test can wait on any of it. */
function collector() {
  const records: ActivityRecord[] = [];
  const states: ConnectionState[] = [];
  return {
    records,
    states,
    sink: {
      state: (state: ConnectionState) => {
        states.push(state);
      },
      activity: (record: ActivityRecord) => {
        records.push(record);
      },
    },
  };
}

/**
 * Kills the engine.io connection under every client without sending a Socket.IO
 * disconnect packet, which is what a lost network looks like from the client.
 */
function dropTransport(server: Server): void {
  for (const socket of server.sockets.sockets.values()) socket.conn.close();
}

async function waitFor(check: () => boolean, label: string): Promise<void> {
  const deadline = Date.now() + 5000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe('assertHttpUrl', () => {
  it('accepts http and https', () => {
    expect(assertHttpUrl('http://127.0.0.1:3000').protocol).toBe('http:');
    expect(assertHttpUrl('https://example.test').protocol).toBe('https:');
  });

  it('accepts ws and wss by rewriting them, which is what a user will paste', () => {
    expect(assertHttpUrl('ws://127.0.0.1:3000').protocol).toBe('http:');
    expect(assertHttpUrl('wss://example.test').protocol).toBe('https:');
  });

  it('rejects every other protocol', () => {
    expect(() => assertHttpUrl('file:///etc/passwd')).toThrow(/http/);
    expect(() => assertHttpUrl('not a url')).toThrow();
  });
});

describe('SocketIoTransportSession', () => {
  it('connects to a namespace and reports open', async () => {
    const server = await startServer('/chat');
    const seen = collector();
    const session = new SocketIoTransportSession('c1', seen.sink);

    await session.open(target(server.url, { namespace: '/chat' }));
    await waitFor(() => seen.states.includes('open'), 'open');
    session.dispose();
  });

  it('emits a named event the server receives with its argument', async () => {
    const server = await startServer();
    const received: unknown[] = [];
    server.of.on('connection', (socket: Socket) => {
      socket.on('greet', (payload: unknown) => received.push(payload));
    });

    const seen = collector();
    const session = new SocketIoTransportSession('c2', seen.sink);
    await session.open(target(server.url));
    await session.send({ kind: 'socketio', event: 'greet', body: 'hola', argument: 'text', ack: false });

    await waitFor(() => received.length === 1, 'the emitted event');
    expect(received[0]).toBe('hola');
    session.dispose();
  });

  it('delivers a binary argument byte for byte', async () => {
    const server = await startServer();
    const received: Buffer[] = [];
    server.of.on('connection', (socket: Socket) => {
      socket.on('blob', (payload: Buffer) => received.push(payload));
    });

    const bytes = new Uint8Array([0x00, 0xff, 0x7f, 0x80, 0x41]);
    const seen = collector();
    const session = new SocketIoTransportSession('c3', seen.sink);
    await session.open(target(server.url));
    await session.send({
      kind: 'socketio',
      event: 'blob',
      body: bytesToBase64(bytes),
      argument: 'binary',
      ack: false,
    });

    await waitFor(() => received.length === 1, 'the binary argument');
    const [delivered = Buffer.alloc(0)] = received;
    expect(new Uint8Array(delivered)).toEqual(bytes);
    session.dispose();
  });

  it('records an incoming event under its own name', async () => {
    const server = await startServer();
    server.of.on('connection', (socket: Socket) => {
      socket.emit('tick', { n: 1 });
    });

    const seen = collector();
    const session = new SocketIoTransportSession('c4', seen.sink);
    await session.open(target(server.url));

    await waitFor(() => seen.records.some((record) => record.kind === 'incoming'), 'the event');
    const record = seen.records.find((entry) => entry.kind === 'incoming');
    expect(record?.transportKind).toBe('socketio');
    expect(record?.label).toBe('tick');
    expect(JSON.parse(record?.body ?? 'null')).toEqual({ n: 1 });
    session.dispose();
  });

  it('logs the answer to an emit that asked for an ack', async () => {
    const server = await startServer();
    server.of.on('connection', (socket: Socket) => {
      socket.on('ask', (_payload: unknown, ack: (answer: unknown) => void) => {
        ack({ ok: true });
      });
    });

    const seen = collector();
    const session = new SocketIoTransportSession('c5', seen.sink);
    await session.open(target(server.url));
    await session.send({ kind: 'socketio', event: 'ask', body: '1', argument: 'json', ack: true });

    await waitFor(() => seen.records.some((record) => record.kind === 'incoming'), 'the ack');
    const answer = seen.records.find((record) => record.kind === 'incoming');
    expect(JSON.parse(answer?.body ?? 'null')).toEqual({ ok: true });
    session.dispose();
  });

  it('refuses an argument above the ceiling before it reaches the socket', async () => {
    const server = await startServer();
    const seen = collector();
    const session = new SocketIoTransportSession('c6', seen.sink);
    await session.open(target(server.url, { maxMessageBytes: 1024 }));

    await expect(
      session.send({
        kind: 'socketio',
        event: 'big',
        body: 'x'.repeat(2048),
        argument: 'text',
        ack: false,
      }),
    ).rejects.toThrow();
    session.dispose();
  });

  it('reconnects on its own after the server drops the socket', async () => {
    const server = await startServer();
    const seen = collector();
    const session = new SocketIoTransportSession('c7', seen.sink);
    await session.open(
      target(server.url, {
        retry: { enabled: true, attempts: 5, baseMs: 100, maxMs: 300 },
      }),
    );
    await waitFor(() => seen.states.includes('open'), 'the first open');

    // The transport dies underneath, which is what a dropped connection is.
    // `disconnectSockets` would be the server disconnecting on purpose, and
    // Socket.IO never retries that one — a different case, not this one.
    dropTransport(server.io);
    await waitFor(() => seen.states.filter((state) => state === 'open').length === 2, 'the reopen');
    expect(seen.states).toContain('dropped');
    session.dispose();
  }, 15000);
});
