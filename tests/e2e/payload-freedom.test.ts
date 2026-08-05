import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron, expect, test } from '@playwright/test';
import { openWorkspace, seededConnection } from './fixtures/workbench.js';

const WORKSPACE_ID = 'e2e-payload';

/**
 * An imported event whose payload disagrees with its own schema, seeded straight
 * into the workspaces directory: the import path goes through a native file
 * dialog, which Playwright cannot drive. The payload arrives on one line, which
 * is what the beautify button is for.
 */
const workspace = {
  id: WORKSPACE_ID,
  version: 1,
  name: 'Payload',
  environments: [],
  connections: [seededConnection()],
  catalog: {
    collections: [{ id: 'col-1', name: 'General' }],
    items: [
      {
        id: 'item-1',
        collectionId: 'col-1',
        name: 'Ping',
        payload: '{"event":"Ping","data":{"id":"nope"}}',
        source: 'asyncapi',
        schema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            event: { const: 'Ping' },
            data: { type: 'object', properties: { id: { type: 'integer' } } },
          },
          required: ['event', 'data'],
        },
      },
    ],
  },
};

/**
 * The composer passes no judgement on a frame. An imported event still carries
 * the schema it was described by, and the app must open it, ignore it, and put
 * whatever the tester wrote on the wire — a client is free to use any shape it
 * likes. This also guards the renderer's CSP: the validator that used to run
 * here compiled schemas into JavaScript and evaluated them, which the policy
 * forbids, and the whole unit suite stayed green because jsdom has no CSP.
 */
test('opens an event with a schema without validating it, and beautifies on demand', async () => {
  const userData = await mkdtemp(join(tmpdir(), 'wsw-e2e-'));
  await mkdir(join(userData, 'workspaces'), { recursive: true });
  await writeFile(
    join(userData, 'workspaces', `${WORKSPACE_ID}.json`),
    JSON.stringify({ ...workspace, updatedAt: new Date().toISOString() }, null, 2),
    'utf8',
  );

  const app = await electron.launch({
    args: ['.', `--user-data-dir=${userData}`],
    env: { ...process.env, NODE_ENV: 'test' },
  });

  try {
    const window = await openWorkspace(app, 'Payload');
    const violations: string[] = [];
    window.on('console', (message) => {
      if (message.text().includes('Content Security Policy')) violations.push(message.text());
    });

    // The row's own text, not the row: its `…` menu answers to the name too.
    await window.getByText('Ping', { exact: true }).click();
    // The panel title became a breadcrumb in phase 2: collection, then event.
    await expect(window.getByLabel('Ubicación del evento')).toContainText('Ping');
    expect(violations).toEqual([]);

    // The payload breaks the schema and the app says nothing at all about it.
    await expect(window.getByText('/data/id', { exact: false })).toHaveCount(0);
    await expect(window.getByText('Aviso', { exact: true })).toHaveCount(0);

    // Only the socket keeps the send button down.
    await expect(window.getByRole('button', { name: 'Enviar' })).toHaveAttribute(
      'title',
      'Conecta el socket para enviar',
    );

    // One line in, six out: what the footer replaced the validator with.
    const lines = window.locator('[data-part="payload-editor"] .view-line');
    await expect(lines).toHaveCount(1);
    await window.getByRole('button', { name: 'Formatear' }).click();
    await expect(lines).toHaveCount(6);
  } finally {
    await app.close();
  }
});
