import { cloneConnectionSettings } from './defaults.js';
import { DEFAULT_COLLECTION_NAME } from './factory.js';

type Unknowns = Record<string, unknown>;

function isRecord(value: unknown): value is Unknowns {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function records(value: unknown): Unknowns[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

/**
 * Brings a stored document up to the current version before it is parsed, so
 * the rest of the app only ever sees the shape in `types.ts`. Anything already
 * current — or too broken to recognise — is handed back untouched for the
 * schema to accept or reject on its own terms.
 */
export function migrateWorkspace(input: unknown): unknown {
  if (!isRecord(input)) return input;
  // Chained rather than branched: a v1 file has to pass through v2 to reach the
  // current shape, and each step only has to know about the one before it.
  const v2 = input.version === 1 ? fromV1(input) : input;
  return v2.version === 2 ? fromV2(v2) : v2;
}

/**
 * v1 called collections "folders" and let an event live outside one
 * (`folderId: null`). v2 makes membership mandatory, so the orphans move into a
 * `General` collection — reused if the document already has one by that name,
 * created here otherwise. No event is dropped.
 */
function fromV1(workspace: Unknowns): Unknowns {
  const catalog = isRecord(workspace.catalog) ? workspace.catalog : {};
  const collections = records(catalog.folders).map((folder) => ({
    id: folder.id,
    name: folder.name,
  }));
  const items = records(catalog.items);
  const orphans = items.some((item) => typeof item.folderId !== 'string');

  let fallbackId: unknown = null;
  if (orphans) {
    const existing = collections.find((entry) => entry.name === DEFAULT_COLLECTION_NAME);
    if (existing === undefined) {
      const created = { id: globalThis.crypto.randomUUID(), name: DEFAULT_COLLECTION_NAME };
      collections.unshift(created);
      fallbackId = created.id;
    } else {
      fallbackId = existing.id;
    }
  }

  return {
    ...workspace,
    version: 2,
    catalog: {
      collections,
      items: items.map(({ folderId, ...rest }) => ({
        ...rest,
        collectionId: typeof folderId === 'string' ? folderId : fallbackId,
      })),
    },
  };
}

/**
 * v3 gives every connection its own settings — headers, subprotocols, retry,
 * keepalive, certificate verification, payload ceiling. A v2 document has none,
 * so each connection is filled with the defaults, which describe exactly the
 * behaviour it already had: nothing about an upgraded workspace connects
 * differently than it did before.
 */
function fromV2(workspace: Unknowns): Unknowns {
  return {
    ...workspace,
    version: 3,
    connections: records(workspace.connections).map((connection) => ({
      ...connection,
      // Per connection, so a header added to one never appears on another.
      settings: cloneConnectionSettings(),
    })),
  };
}
