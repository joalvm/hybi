import type { Collection, EventCatalog, EventItem } from '@shared/domain/types.js';

/**
 * Folds an AsyncAPI import into the catalog. Collections are matched by name, so
 * importing the same document twice — or two documents that share a domain —
 * reuses the existing collection instead of duplicating the tree. Items always
 * arrive as new entries: an import never overwrites a payload the user edited.
 */
export function mergeImported(
  catalog: EventCatalog,
  collections: Collection[],
  items: EventItem[],
): EventCatalog {
  const idByName = new Map(catalog.collections.map((entry) => [entry.name, entry.id]));
  const added: Collection[] = [];
  const remapped = new Map<string, string>();

  for (const collection of collections) {
    const existing = idByName.get(collection.name);
    if (existing === undefined) {
      idByName.set(collection.name, collection.id);
      added.push(collection);
    } else {
      remapped.set(collection.id, existing);
    }
  }

  return {
    collections: catalog.collections.concat(added),
    items: catalog.items.concat(items.map((entry) => withRemappedCollection(entry, remapped))),
  };
}

function withRemappedCollection(item: EventItem, remapped: Map<string, string>): EventItem {
  const collectionId = remapped.get(item.collectionId);
  return collectionId === undefined ? item : { ...item, collectionId };
}
