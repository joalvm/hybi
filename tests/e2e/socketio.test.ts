import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron, expect, test } from '@playwright/test';
import { startSocketIoServer } from './fixtures/socketio-server.js';
import { openWorkspace } from './fixtures/workbench.js';

const WORKSPACE_ID = 'e2e-socketio';

/**
 * A seeded Socket.IO connection in the exact shape the workspace file stores.
 * Written out here rather than imported from the domain because these tests run
 * against the packaged main process: if the persisted shape drifts, the seed
 * must fail with it instead of following it.
 */
function seededSocketIoConnection(url: string, namespace: string) {
  return {
    id: 'conn-1',
    name: 'chat',
    environmentId: null,
    transport: {
      kind: 'socketio',
      url,
      settings: {
        namespace,
        path: '/socket.io',
        auth: [],
        headers: [],
        transports: ['websocket'],
        retry: { enabled: true, attempts: 5, baseMs: 500, maxMs: 8000 },
        ackTimeoutMs: 10000,
        verifyCertificate: true,
        maxMessageBytes: 104857600,
      },
    },
  };
}

function workspaceWith(url: string, namespace: string) {
  return {
    id: WORKSPACE_ID,
    version: 1,
    name: 'SocketIO',
    environments: [],
    connections: [seededSocketIoConnection(url, namespace)],
    catalog: {
      collections: [{ id: 'col-1', name: 'General' }],
      items: [
        {
          id: 'item-1',
          collectionId: 'col-1',
          name: 'greeting',
          payload: '{"hello":"world"}',
          source: 'manual',
        },
      ],
    },
  };
}

/**
 * The same ground the WebSocket flow covers, against a real Socket.IO server:
 * joining a namespace, emitting under a name the server routes on, and reading
 * both what came back and the answer to an ack.
 */
test('joins a namespace, emits a named event and logs the ack', async () => {
  const server = await startSocketIoServer();
  const userData = await mkdtemp(join(tmpdir(), 'wsw-e2e-'));
  await mkdir(join(userData, 'workspaces'), { recursive: true });
  await writeFile(
    join(userData, 'workspaces', `${WORKSPACE_ID}.json`),
    JSON.stringify(
      { ...workspaceWith(server.url, server.namespace), updatedAt: new Date().toISOString() },
      null,
      2,
    ),
    'utf8',
  );

  const app = await electron.launch({
    args: ['.', `--user-data-dir=${userData}`],
    env: { ...process.env, NODE_ENV: 'test' },
  });

  try {
    const window = await openWorkspace(app, 'SocketIO');

    await window.getByRole('button', { name: 'Connect', exact: true }).click();
    await expect(window.getByRole('button', { name: 'Disconnect', exact: true })).toBeVisible();
    // The namespace that was joined, said in the log rather than assumed.
    await expect(window.getByText(`Namespace ${server.namespace}`)).toBeVisible();

    await window.getByText('greeting', { exact: true }).click();
    await expect(window.getByLabel('Event location')).toContainText('greeting');

    // The emit bar belongs to this transport, and it opens on the event's name.
    await expect(window.getByRole('textbox', { name: 'Event' })).toHaveValue('greeting');
    await window.getByRole('checkbox', { name: 'Wait for ack' }).check();
    await window.getByRole('button', { name: 'Send' }).click();

    // Two lines come back and the log tells them apart: the echo arrives under
    // the server's own event name, and the answer to the ack keeps the name it
    // was asked under. Both carry the argument that was actually emitted, which
    // is what says the payload crossed as an object rather than as its spelling.
    await expect(
      window.getByText('{"event":"greeting","payload":{"hello":"world"}}', { exact: true }),
    ).toBeVisible();
    await expect(
      window.getByText('{"ack":true,"event":"greeting"}', { exact: true }),
    ).toBeVisible();
    await expect(window.getByText('echo', { exact: true })).toBeVisible();
  } finally {
    await app.close();
    await server.close();
  }
});
