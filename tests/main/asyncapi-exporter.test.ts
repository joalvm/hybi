import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Workspace } from '../../src/shared/domain/types.js';
import { writeAsyncApiExport } from '../../src/main/asyncapi/export-file.js';
import { createAsyncApiDocument } from '../../src/main/asyncapi/exporter.js';
import { importAsyncApi } from '../../src/main/asyncapi/importer.js';

const roots: string[] = [];

function workspace(): Workspace {
  return {
    id: 'workspace-1',
    version: 4,
    name: 'Realtime API',
    environments: [
      {
        id: 'environment-1',
        name: 'Producción',
        variables: [
          { name: 'token', value: 'top-secret', secret: true },
          { name: 'region', value: 'us-east', secret: false },
        ],
      },
    ],
    connections: [
      {
        id: 'connection-1',
        name: 'Producción',
        environmentId: 'environment-1',
        transport: {
          kind: 'websocket',
          url: 'wss://api.example.com/socket?token={{token}}',
          settings: {
            headers: [{ name: 'Authorization', value: 'Bearer {{token}}', enabled: true }],
            protocols: ['events.v1'],
            retry: { enabled: true, attempts: 3, baseMs: 500, maxMs: 5000 },
            keepalive: { enabled: true, intervalMs: 30000, timeoutMs: 5000 },
            verifyCertificate: true,
            maxMessageBytes: 1048576,
          },
        },
      },
    ],
    catalog: {
      collections: [{ id: 'collection-1', name: 'devices' }],
      items: [
        {
          id: 'event-1',
          collectionId: 'collection-1',
          name: 'device.refresh',
          payload: '{\n  "event": "device.refresh"\n}',
          source: 'manual',
          schema: { type: 'object', required: ['event'] },
          description: 'Refreshes one device.',
        },
      ],
    },
  };
}

afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('AsyncAPI workspace export', () => {
  it('maps standard API concepts and keeps Hybi-only state under x-hybi', () => {
    const document = createAsyncApiDocument(workspace());

    expect(document).toMatchObject({
      asyncapi: '3.0.0',
      info: { title: 'Realtime API', version: '1.0.0' },
      servers: {
        connection1: {
          host: 'api.example.com',
          pathname: '/socket',
          protocol: 'wss',
          title: 'Producción',
        },
      },
      channels: {
        event1: {
          address: 'device.refresh',
          messages: { event1: { $ref: '#/components/messages/event1' } },
        },
      },
      operations: {
        receiveEvent1: { action: 'receive', channel: { $ref: '#/channels/event1' } },
      },
    });
    expect(document['x-hybi']).toMatchObject({
      schemaVersion: 1,
      workspace: { id: 'workspace-1', formatVersion: 4 },
      collections: [{ id: 'collection-1', name: 'devices' }],
      connections: [
        {
          id: 'connection-1',
          serverId: 'connection1',
          transport: { settings: { protocols: ['events.v1'] } },
        },
      ],
      eventOrder: ['event-1'],
    });
    expect(document.components.messages.event1?.['x-hybi']).toEqual({
      id: 'event-1',
      collectionId: 'collection-1',
      source: 'manual',
      rawPayload: '{\n  "event": "device.refresh"\n}',
    });
  });

  it('redacts secret variables without mutating the open workspace', () => {
    const source = workspace();
    const document = createAsyncApiDocument(source);

    expect(document['x-hybi'].environments[0]?.variables[0]?.value).toBe('');
    expect(JSON.stringify(document)).not.toContain('top-secret');
    expect(source.environments[0]?.variables[0]?.value).toBe('top-secret');
  });

  it('always writes JSON and remains importable by Hybi', async () => {
    const root = await mkdtemp(join(tmpdir(), 'hybi-export-'));
    roots.push(root);

    const filePath = await writeAsyncApiExport(workspace(), join(root, 'Realtime API.hybi'));
    const raw = await readFile(filePath, 'utf8');

    expect(filePath).toBe(join(root, 'Realtime API.json'));
    expect(raw.endsWith('\n')).toBe(true);
    expect(JSON.parse(raw)).toMatchObject({ asyncapi: '3.0.0' });
    await expect(importAsyncApi(filePath)).resolves.toMatchObject({
      items: [{ name: 'device.refresh' }],
    });
  });
});
