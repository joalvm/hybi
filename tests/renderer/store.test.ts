import { beforeEach, describe, expect, it } from 'vitest';
import { cloneWebSocketSettings } from '@shared/domain/connections/defaults.js';
import { createWorkspace } from '@shared/domain/factory.js';
import type { EventItem, Workspace } from '@shared/domain/types.js';
import type { WebSocketActivityRecord } from '@shared/ipc/activity.js';
import { ACTIVITY_BYTE_LIMIT, ACTIVITY_LIMIT } from '@shared/preferences/defaults.js';
import { useStore } from '@/store/index.js';
import {
  selectEffectivePayload,
  selectIsDirty,
  selectScopeFor,
  selectTotalsFor,
} from '@/store/selectors.js';

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

function activityRecord(
  overrides: Partial<WebSocketActivityRecord> & { id: string },
): WebSocketActivityRecord {
  return {
    connectionId: 'c1',
    transportKind: 'websocket',
    sequence: 1,
    kind: 'incoming',
    at: 0,
    label: 'x',
    body: 'x',
    encoding: 'text',
    bytes: 1,
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
    const records = Array.from({ length: ACTIVITY_LIMIT + 50 }, (_unused, index) =>
      activityRecord({ id: `c1:${String(index)}`, sequence: index, at: index }),
    );
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

  // A count alone cannot bound memory: `maxMessageBytes` allows frames far
  // larger than the log, so the budget is what keeps a chatty peer from growing
  // the renderer until it dies.
  it('evicts by byte budget before reaching the record cap', () => {
    const oneMegabyte = 1024 * 1024;
    const records = Array.from({ length: 40 }, (_unused, index) =>
      activityRecord({ id: `c1:${String(index)}`, sequence: index, bytes: oneMegabyte }),
    );
    useStore.getState().appendActivity(records);

    const stored = useStore.getState().activity.c1 ?? [];
    const retained = stored.reduce((total, record) => total + record.bytes, 0);
    expect(stored.length).toBeLessThan(records.length);
    expect(retained).toBeLessThanOrEqual(ACTIVITY_BYTE_LIMIT);
    // Whatever is dropped, the frame that just arrived is never the one to go.
    expect(stored.at(-1)?.sequence).toBe(39);
  });

  it('keeps one frame even when it alone exceeds the budget', () => {
    useStore
      .getState()
      .appendActivity([activityRecord({ id: 'c1:1', bytes: ACTIVITY_BYTE_LIMIT * 2 })]);
    expect(useStore.getState().activity.c1).toHaveLength(1);
  });

  // `records` answers for the panel and the two sides answer for the wire, so a
  // status line raises the first and leaves the other two alone.
  it('counts messages and bytes by direction, ignoring what is not traffic', () => {
    useStore.getState().appendActivity([
      activityRecord({ id: 'c1:1', kind: 'incoming', bytes: 10 }),
      activityRecord({ id: 'c1:2', kind: 'outgoing', bytes: 4 }),
      activityRecord({ id: 'c1:3', kind: 'incoming', bytes: 6 }),
      activityRecord({ id: 'c1:4', kind: 'status', bytes: 99 }),
    ]);

    expect(selectTotalsFor('c1')(useStore.getState())).toEqual({
      records: 4,
      incoming: { messages: 2, bytes: 16 },
      outgoing: { messages: 1, bytes: 4 },
    });
  });

  // A batch of nothing but status lines still moves the record count, so the
  // reference has to change even when neither side did.
  it('counts a batch that moved no traffic at all', () => {
    useStore.getState().appendActivity([
      activityRecord({ id: 'c1:1', kind: 'status', bytes: 0 }),
      activityRecord({ id: 'c1:2', kind: 'error', bytes: 0 }),
    ]);

    expect(selectTotalsFor('c1')(useStore.getState())).toEqual({
      records: 2,
      incoming: { messages: 0, bytes: 0 },
      outgoing: { messages: 0, bytes: 0 },
    });
  });

  // The counter answers what the socket moved, not what the log still holds:
  // the budget is free to drop records, and the total must not drop with them.
  it('keeps counting past what the log evicts', () => {
    const oneMegabyte = 1024 * 1024;
    useStore.getState().appendActivity(
      Array.from({ length: 40 }, (_unused, index) =>
        activityRecord({ id: `c1:${String(index)}`, sequence: index, bytes: oneMegabyte }),
      ),
    );

    expect(useStore.getState().activity.c1?.length).toBeLessThan(40);
    expect(selectTotalsFor('c1')(useStore.getState())).toEqual({
      records: 40,
      incoming: { messages: 40, bytes: 40 * oneMegabyte },
      outgoing: { messages: 0, bytes: 0 },
    });
  });

  it('resets the totals with the log they describe', () => {
    useStore.getState().appendActivity([activityRecord({ id: 'c1:1', bytes: 10 })]);
    useStore.getState().clearActivity('c1');
    expect(selectTotalsFor('c1')(useStore.getState())).toEqual({
      records: 0,
      incoming: { messages: 0, bytes: 0 },
      outgoing: { messages: 0, bytes: 0 },
    });
  });

  it('splits a batch that carries more than one connection', () => {
    useStore.getState().appendActivity([
      activityRecord({ id: 'c1:1', connectionId: 'c1' }),
      activityRecord({ id: 'c2:1', connectionId: 'c2' }),
      activityRecord({ id: 'c1:2', connectionId: 'c1' }),
    ]);

    expect(useStore.getState().activity.c1?.map((record) => record.id)).toEqual(['c1:1', 'c1:2']);
    expect(useStore.getState().activity.c2?.map((record) => record.id)).toEqual(['c2:1']);
  });
});

describe('dropConnection', () => {
  // A closed tab that keeps its log is the app growing for the rest of the
  // session: nothing can ever read those records again.
  it('forgets every key a deleted connection owned', () => {
    const store = useStore.getState();
    store.appendActivity([activityRecord({ id: 'c1:1' }), activityRecord({ id: 'c2:1', connectionId: 'c2' })]);
    store.setConnectionState('c1', 'open');
    store.setConnectionState('c2', 'open');
    store.setDraft('c1', 'e1', '{"a":1}');
    store.setDraft('c2', 'e1', '{"b":2}');
    store.setSelectedEvent('c1', 'e1');
    store.setSelectedEvent('c2', 'e1');
    store.setSelectedActivity('c1', 'c1:1');
    store.setActiveConnection('c1');
    store.openConnectionSettings('c1');

    useStore.getState().dropConnection('c1');

    const next = useStore.getState();
    expect(next.activity.c1).toBeUndefined();
    expect(next.totals.c1).toBeUndefined();
    expect(next.states.c1).toBeUndefined();
    expect(next.drafts['c1:e1']).toBeUndefined();
    expect(next.selectedEventByConnection.c1).toBeUndefined();
    expect(next.selectedActivityByConnection.c1).toBeUndefined();
    expect(next.settingsConnectionId).toBeNull();

    // The neighbour is untouched: this drops one connection, not the runtime.
    expect(next.activity.c2).toHaveLength(1);
    expect(next.states.c2).toBe('open');
    expect(next.drafts['c2:e1']).toBe('{"b":2}');
    expect(next.selectedEventByConnection.c2).toBe('e1');
  });

  it('leaves an open settings dialog for another connection alone', () => {
    useStore.getState().openConnectionSettings('c2');
    useStore.getState().dropConnection('c1');
    expect(useStore.getState().settingsConnectionId).toBe('c2');
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
      environmentId: 'env1',
      transport: {
        kind: 'websocket',
        url: 'ws://x',
        settings: cloneWebSocketSettings(),
      },
    });
    useStore.getState().setWorkspace(workspace);

    useStore.getState().removeEnvironment('env1');

    expect(useStore.getState().workspace?.environments).toHaveLength(0);
    expect(useStore.getState().workspace?.connections[0]?.environmentId).toBeNull();
  });
});

describe('activity kind filter', () => {
  // An absent key means visible, so the log starts showing everything and a
  // kind added later is not hidden by a stale record.
  it('hides one kind and shows it again', () => {
    expect(useStore.getState().hiddenActivityKinds).toEqual({});

    useStore.getState().toggleActivityKind('status');
    expect(useStore.getState().hiddenActivityKinds).toEqual({ status: true });

    useStore.getState().toggleActivityKind('status');
    expect(useStore.getState().hiddenActivityKinds).toEqual({});
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
      environmentId: 'env1',
      transport: {
        kind: 'websocket',
        url: 'ws://{{host}}',
        settings: cloneWebSocketSettings(),
      },
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
