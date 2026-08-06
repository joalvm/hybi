import { cloneConnectionTransport } from './connections/defaults.js';
import { createConnection } from './connections/factory.js';
export {
  createConnection,
  createWebSocketTransport,
  duplicateConnection,
} from './connections/factory.js';
import type {
  Collection,
  Environment,
  EventItem,
  Workspace,
} from './types.js';

/** The collection every workspace starts with. */
export const DEFAULT_COLLECTION_NAME = 'General';

function newId(): string {
  return globalThis.crypto.randomUUID();
}

export function createWorkspace(name: string): Workspace {
  return {
    id: newId(),
    version: 1,
    name,
    environments: [],
    connections: [],
    // Seeded rather than empty: collection membership is mandatory, so a fresh
    // workspace would otherwise have nowhere to put its first event.
    catalog: { collections: [createCollection(DEFAULT_COLLECTION_NAME)], items: [] },
  };
}

export function createEnvironment(name: string): Environment {
  return { id: newId(), name, variables: [] };
}

/**
 * The editor always needs one active surface, while environments stay optional.
 * The name is passed in because both processes call this and neither catalog
 * reaches here: `shared` answers for the shape, not for the wording.
 */
export function ensureStarterConnection(workspace: Workspace, name: string): Workspace {
  if (workspace.connections.length > 0) return workspace;
  return {
    ...workspace,
    connections: [createConnection({ name })],
  };
}

export function createCollection(name: string): Collection {
  return { id: newId(), name };
}

/**
 * A new event starts empty: the payload is written in the composer, and a
 * skeleton here would only be text to delete before the first real one.
 */
export function createEventItem(input: {
  name: string;
  collectionId: string;
  payload?: string;
}): EventItem {
  return {
    id: newId(),
    collectionId: input.collectionId,
    name: input.name,
    payload: input.payload ?? '',
    source: 'manual',
  };
}

/** Fresh ids paired with the old ones, so references can follow the copy. */
function reissue<T extends { id: string }>(list: readonly T[]): { list: T[]; ids: Map<string, string> } {
  const ids = new Map<string, string>();
  const copies = list.map((entry) => {
    const id = newId();
    ids.set(entry.id, id);
    return { ...entry, id };
  });
  return { list: copies, ids };
}

/**
 * An independent copy. Every id is regenerated — sharing one would make the two
 * workspaces overwrite each other's file — and the references that pointed at
 * the originals are remapped to their copies.
 */
export function duplicateWorkspace(source: Workspace, name: string): Workspace {
  const environments = reissue(source.environments);
  const collections = reissue(source.catalog.collections);

  return {
    id: newId(),
    version: 1,
    name,
    environments: environments.list.map((entry) => ({
      ...entry,
      variables: entry.variables.map((variable) => ({ ...variable })),
    })),
    connections: reissue(source.connections).list.map((entry) => ({
      ...entry,
      environmentId:
        entry.environmentId === null ? null : environments.ids.get(entry.environmentId) ?? null,
      // `reissue` spreads one level deep, which would leave both workspaces
      // pointing at the same transport settings.
      transport: cloneConnectionTransport(entry.transport),
    })),
    catalog: {
      collections: collections.list,
      items: reissue(source.catalog.items).list.map((entry) => ({
        ...entry,
        collectionId: collections.ids.get(entry.collectionId) ?? entry.collectionId,
      })),
    },
  };
}
