import { describe, expect, it } from 'vitest';
import { DEFAULT_WEBSOCKET_SETTINGS } from '@shared/domain/connections/defaults.js';
import { migrateWorkspace } from '@shared/domain/migrate.js';
import { parseWorkspace } from '@shared/domain/schema.js';
import { createWorkspace } from '@shared/domain/factory.js';

function v1(items: unknown[], folders: unknown[] = [], connections: unknown[] = []): unknown {
  return {
    id: 'w1',
    version: 1,
    name: 'Legacy',
    environments: [],
    connections,
    catalog: { folders, items },
  };
}
function v2(connections: unknown[]): unknown {
  return {
    id: 'w2',
    version: 2,
    name: 'Legacy',
    environments: [],
    connections,
    catalog: { collections: [{ id: 'c1', name: 'General' }], items: [] },
  };
}
function v3(connections: unknown[]): unknown {
  return {
    id: 'w3',
    version: 3,
    name: 'Legacy',
    environments: [],
    connections,
    catalog: { collections: [{ id: 'c1', name: 'General' }], items: [] },
  };
}
const connection = (overrides: Record<string, unknown> = {}) => ({
  id: 'n1',
  name: 'local',
  url: 'ws://127.0.0.1:3000',
  environmentId: null,
  ...overrides,
});
const item = (overrides: Record<string, unknown>) => ({
  id: 'e1',
  name: 'Login',
  payload: '{}',
  source: 'manual',
  ...overrides,
});

describe('migrateWorkspace', () => {
  it('renames folders to collections and keeps the membership', () => {
    const migrated = parseWorkspace(
      migrateWorkspace(v1([item({ folderId: 'f1' })], [{ id: 'f1', name: 'devices' }])),
    );

    expect(migrated.version).toBe(4);
    expect(migrated.catalog.collections).toEqual([{ id: 'f1', name: 'devices' }]);
    expect(migrated.catalog.items[0]?.collectionId).toBe('f1');
  });

  it('carries a v1 document all the way to the current version', () => {
    const migrated = parseWorkspace(
      migrateWorkspace(v1([item({ folderId: 'f1' })], [{ id: 'f1', name: 'devices' }], [connection()])),
    );

    expect(migrated.version).toBe(4);
    expect(migrated.connections[0]?.transport).toEqual({
      kind: 'websocket',
      url: 'ws://127.0.0.1:3000',
      settings: DEFAULT_WEBSOCKET_SETTINGS,
    });
  });

  it('moves an orphan event into a General collection it creates', () => {
    const migrated = parseWorkspace(migrateWorkspace(v1([item({ folderId: null })])));

    const [general] = migrated.catalog.collections;
    expect(general?.name).toBe('General');
    expect(migrated.catalog.items[0]?.collectionId).toBe(general?.id);
  });

  it('reuses a General collection the document already had', () => {
    const migrated = parseWorkspace(
      migrateWorkspace(
        v1(
          [item({ folderId: null }), item({ id: 'e2', folderId: 'f1' })],
          [{ id: 'f1', name: 'General' }],
        ),
      ),
    );

    expect(migrated.catalog.collections).toHaveLength(1);
    expect(migrated.catalog.items.map((entry) => entry.collectionId)).toEqual(['f1', 'f1']);
  });

  it('fills every v2 connection with the settings it used to have implicitly', () => {
    const migrated = parseWorkspace(
      migrateWorkspace(v2([connection(), connection({ id: 'n2', name: 'staging' })])),
    );

    expect(migrated.version).toBe(4);
    expect(migrated.connections.map((entry) => entry.transport.settings)).toEqual([
      DEFAULT_WEBSOCKET_SETTINGS,
      DEFAULT_WEBSOCKET_SETTINGS,
    ]);
  });

  /** Shared defaults would make a header added to one connection appear on all. */
  it('gives each migrated connection its own settings object', () => {
    const migrated = parseWorkspace(
      migrateWorkspace(v2([connection(), connection({ id: 'n2', name: 'staging' })])),
    );

    migrated.connections[0]?.transport.settings.headers.push({
      name: 'Authorization',
      value: '{{token}}',
      enabled: true,
    });
    expect(migrated.connections[1]?.transport.settings.headers).toHaveLength(0);
  });

  it('moves a v3 connection into one discriminated WebSocket transport', () => {
    const settings = {
      ...structuredClone(DEFAULT_WEBSOCKET_SETTINGS),
      protocols: ['graphql-ws'],
    };
    const migrated = parseWorkspace(migrateWorkspace(v3([connection({ settings })])));

    expect(migrated.connections[0]).toEqual({
      id: 'n1',
      name: 'local',
      environmentId: null,
      transport: {
        kind: 'websocket',
        url: 'ws://127.0.0.1:3000',
        settings,
      },
    });
    expect(migrated.connections[0]).not.toHaveProperty('url');
    expect(migrated.connections[0]).not.toHaveProperty('settings');
  });

  it('leaves a current document untouched', () => {
    const workspace = createWorkspace('Demo');
    expect(migrateWorkspace(structuredClone(workspace))).toEqual(workspace);
  });
});
