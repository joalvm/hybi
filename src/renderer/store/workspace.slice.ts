import type { StateCreator } from 'zustand';
import { createEnvironment } from '@shared/domain/factory.js';
import type {
  Collection,
  Connection,
  EventCatalog,
  EventItem,
  Variable,
  Workspace,
} from '@shared/domain/types.js';
import { mergeImported } from './merge-import.js';

/** Actions are function properties, not methods. See the note on `UiSlice`. */
export type WorkspaceSlice = {
  workspace: Workspace | null;
  setWorkspace: (workspace: Workspace) => void;
  setWorkspaceName: (name: string) => void;
  upsertConnection: (connection: Connection) => void;
  removeConnection: (connectionId: string) => void;
  upsertEventItem: (item: EventItem) => void;
  removeEventItem: (itemId: string) => void;
  upsertCollection: (collection: Collection) => void;
  removeCollection: (collectionId: string) => void;
  moveEventItem: (itemId: string, collectionId: string) => void;
  addImported: (collections: Collection[], items: EventItem[]) => void;
  addEnvironment: (name: string) => void;
  renameEnvironment: (environmentId: string, name: string) => void;
  removeEnvironment: (environmentId: string) => void;
  setEnvironmentVariables: (environmentId: string, variables: Variable[]) => void;
};

function upsert<T extends { id: string }>(list: readonly T[], entry: T): T[] {
  return list.some((existing) => existing.id === entry.id)
    ? list.map((existing) => (existing.id === entry.id ? entry : existing))
    : [...list, entry];
}

export const createWorkspaceSlice: StateCreator<WorkspaceSlice, [], [], WorkspaceSlice> = (set) => {
  // Returning `current` unchanged when no workspace is loaded keeps zustand
  // from notifying subscribers about a set that changed nothing.
  const update = (mutate: (workspace: Workspace) => Workspace): void => {
    set((current) => (current.workspace === null ? current : { workspace: mutate(current.workspace) }));
  };

  const updateCatalog = (mutate: (catalog: EventCatalog) => EventCatalog): void => {
    update((workspace) => ({ ...workspace, catalog: mutate(workspace.catalog) }));
  };

  return {
    workspace: null,

    setWorkspace: (workspace) => {
      set({ workspace });
    },

    setWorkspaceName: (name) => {
      update((workspace) => ({ ...workspace, name }));
    },

    upsertConnection: (connection) => {
      update((workspace) => ({
        ...workspace,
        connections: upsert(workspace.connections, connection),
      }));
    },

    removeConnection: (connectionId) => {
      update((workspace) => ({
        ...workspace,
        connections: workspace.connections.filter((entry) => entry.id !== connectionId),
      }));
    },

    upsertEventItem: (item) => {
      updateCatalog((catalog) => ({ ...catalog, items: upsert(catalog.items, item) }));
    },

    removeEventItem: (itemId) => {
      updateCatalog((catalog) => ({
        ...catalog,
        items: catalog.items.filter((entry) => entry.id !== itemId),
      }));
    },

    upsertCollection: (collection) => {
      updateCatalog((catalog) => ({
        ...catalog,
        collections: upsert(catalog.collections, collection),
      }));
    },

    // Membership is mandatory, so the events go with the collection. The caller
    // confirms with the count first — this is the destructive half of that.
    removeCollection: (collectionId) => {
      updateCatalog((catalog) => ({
        collections: catalog.collections.filter((entry) => entry.id !== collectionId),
        items: catalog.items.filter((entry) => entry.collectionId !== collectionId),
      }));
    },

    moveEventItem: (itemId, collectionId) => {
      updateCatalog((catalog) => ({
        ...catalog,
        items: catalog.items.map((entry) =>
          entry.id === itemId ? { ...entry, collectionId } : entry,
        ),
      }));
    },

    addImported: (collections, items) => {
      updateCatalog((catalog) => mergeImported(catalog, collections, items));
    },

    addEnvironment: (name) => {
      update((workspace) => ({
        ...workspace,
        environments: workspace.environments.concat(createEnvironment(name)),
      }));
    },

    renameEnvironment: (environmentId, name) => {
      update((workspace) => ({
        ...workspace,
        environments: workspace.environments.map((entry) =>
          entry.id === environmentId ? { ...entry, name } : entry,
        ),
      }));
    },

    // Connections pointing at it fall back to no environment: leaving the
    // reference behind would make the document fail its own schema.
    removeEnvironment: (environmentId) => {
      update((workspace) => ({
        ...workspace,
        environments: workspace.environments.filter((entry) => entry.id !== environmentId),
        connections: workspace.connections.map((entry) =>
          entry.environmentId === environmentId ? { ...entry, environmentId: null } : entry,
        ),
      }));
    },

    setEnvironmentVariables: (environmentId, variables) => {
      update((workspace) => ({
        ...workspace,
        environments: workspace.environments.map((entry) =>
          entry.id === environmentId ? { ...entry, variables } : entry,
        ),
      }));
    },
  };
};
