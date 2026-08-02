import { beforeEach, describe, expect, it } from 'vitest';
import { cloneConnectionSettings } from '@shared/domain/defaults.js';
import { createWorkspace } from '@shared/domain/factory.js';
import type { EventItem, Workspace } from '@shared/domain/types.js';
import { ACTIVITY_LIMIT, useStore } from '@/store/index.js';
import { selectEffectivePayload, selectIsDirty, selectScopeFor } from '@/store/selectors.js';

beforeEach(() => {
  useStore.getState().reset();
});

function item(overrides: Partial<EventItem> & { id: string }): EventItem {
  return {
    collectionId: 'c1',
    name: overrides.id,
    payload: '{}',
    source: 'manual',
    ...overrides,
  };
}

function workspaceWithCatalog(): Workspace {
  const workspace = createWorkspace('Demo');
  workspace.catalog.collections = [
    { id: 'c1', name: 'Auth' },
    { id: 'c2', name: 'Chat' },
  ];
  workspace.catalog.items.push(item({ id: 'e1', collectionId: 'c1', payload: '{"a":1}' }));
  workspace.catalog.items.push(item({ id: 'e2', collectionId: 'c2' }));
  return workspace;
}

describe('runtime slice', () => {
  it('caps the activity ring buffer per connection', () => {
    const records = Array.from({ length: ACTIVITY_LIMIT + 50 }, (_unused, index) => ({
      id: `c1:${String(index)}`,
      connectionId: 'c1',
      sequence: index,
      kind: 'incoming' as const,
      at: index,
      label: 'x',
      body: 'x',
      bytes: 1,
    }));
    useStore.getState().appendActivity(records);
    const stored = useStore.getState().activity.c1 ?? [];
    expect(stored).toHaveLength(ACTIVITY_LIMIT);
    expect(stored.at(-1)?.sequence).toBe(ACTIVITY_LIMIT + 49);
  });

  it('keeps drafts scoped to a connection and event pair', () => {
    useStore.getState().setDraft('c1', 'e1', '{"a":1}');
    expect(useStore.getState().drafts['c1:e1']).toBe('{"a":1}');
    expect(useStore.getState().drafts['c2:e1']).toBeUndefined();
  });
});

describe('workspace slice', () => {
  it('deletes the events of a deleted collection and leaves the rest alone', () => {
    useStore.getState().setWorkspace(workspaceWithCatalog());
    useStore.getState().removeCollection('c1');

    const catalog = useStore.getState().workspace?.catalog;
    expect(catalog?.collections.map((entry) => entry.id)).toEqual(['c2']);
    expect(catalog?.items.map((entry) => entry.id)).toEqual(['e2']);
  });

  it('moves an item between collections and changes nothing else', () => {
    useStore.getState().setWorkspace(workspaceWithCatalog());

    useStore.getState().moveEventItem('e2', 'c1');
    expect(useStore.getState().workspace?.catalog.items[1]).toMatchObject({
      id: 'e2',
      collectionId: 'c1',
      payload: '{}',
    });
  });

  it('merges an import into the collections that already exist by name', () => {
    useStore.getState().setWorkspace(workspaceWithCatalog());
    useStore.getState().addImported(
      [
        { id: 'imported-auth', name: 'Auth' },
        { id: 'imported-rooms', name: 'Rooms' },
      ],
      [
        item({ id: 'e3', collectionId: 'imported-auth', source: 'asyncapi' }),
        item({ id: 'e4', collectionId: 'imported-rooms', source: 'asyncapi' }),
      ],
    );

    const catalog = useStore.getState().workspace?.catalog;
    expect(catalog?.collections.map((entry) => entry.name)).toEqual(['Auth', 'Chat', 'Rooms']);
    expect(catalog?.items.find((entry) => entry.id === 'e3')?.collectionId).toBe('c1');
    expect(catalog?.items.find((entry) => entry.id === 'e4')?.collectionId).toBe('imported-rooms');
  });

  it('clears an environment from the connections that used it', () => {
    const workspace = createWorkspace('Demo');
    workspace.environments.push({ id: 'env1', name: 'local', variables: [] });
    workspace.connections.push({
      id: 'c1',
      name: 'local',
      url: 'ws://x',
      environmentId: 'env1',
      settings: cloneConnectionSettings(),
    });
    useStore.getState().setWorkspace(workspace);

    useStore.getState().removeEnvironment('env1');

    expect(useStore.getState().workspace?.environments).toHaveLength(0);
    expect(useStore.getState().workspace?.connections[0]?.environmentId).toBeNull();
  });
});

describe('collapsed collections', () => {
  it('starts expanded and toggles one collection', () => {
    const store = useStore.getState();
    expect(store.collapsedCollections).toEqual({});

    store.toggleCollection('c1');
    expect(useStore.getState().collapsedCollections).toEqual({ c1: true });

    useStore.getState().toggleCollection('c1');
    expect(useStore.getState().collapsedCollections).toEqual({});
  });

  it('collapses and expands the whole list', () => {
    useStore.getState().collapseAllCollections(['c1', 'c2']);
    expect(useStore.getState().collapsedCollections).toEqual({ c1: true, c2: true });

    useStore.getState().expandAllCollections();
    expect(useStore.getState().collapsedCollections).toEqual({});
  });
});

describe('selectors', () => {
  it('layers the connection environment and prefers the draft', () => {
    const workspace = createWorkspace('Demo');
    workspace.environments.push({
      id: 'env1',
      name: 'local',
      variables: [{ name: 'host', value: '127.0.0.1', secret: false }],
    });
    workspace.connections.push({
      id: 'c1',
      name: 'local',
      url: 'ws://{{host}}',
      environmentId: 'env1',
      settings: cloneConnectionSettings(),
    });
    workspace.catalog.items.push({
      id: 'e1',
      collectionId: 'c1',
      name: 'Login',
      payload: '{"host":"{{host}}"}',
      source: 'manual',
    });

    useStore.getState().setWorkspace(workspace);
    useStore.getState().setSelectedEvent('c1', 'e1');

    expect(selectScopeFor('c1')(useStore.getState()).get('host')?.value).toBe('127.0.0.1');
    expect(selectEffectivePayload('c1')(useStore.getState())).toBe('{"host":"{{host}}"}');
    expect(selectIsDirty('c1')(useStore.getState())).toBe(false);

    useStore.getState().setDraft('c1', 'e1', '{"host":"x"}');
    expect(selectEffectivePayload('c1')(useStore.getState())).toBe('{"host":"x"}');
    expect(selectIsDirty('c1')(useStore.getState())).toBe(true);
  });
});
