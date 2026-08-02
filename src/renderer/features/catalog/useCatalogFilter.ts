import { useMemo } from 'react';
import type { Collection, EventCatalog, EventItem } from '@shared/domain/types.js';

export type CatalogGroup = { collection: Collection; items: EventItem[] };

export function filterCatalog(catalog: EventCatalog, query: string): CatalogGroup[] {
  const needle = query.trim().toLowerCase();
  const matches = (item: EventItem): boolean =>
    needle === '' || item.name.toLowerCase().includes(needle);

  return (
    catalog.collections
      .map((collection) => ({
        collection,
        items: catalog.items.filter(
          (item) => item.collectionId === collection.id && matches(item),
        ),
      }))
      // An empty collection stays visible while browsing, so one created by hand
      // can be seen and filled. A search hides it: it matched nothing.
      .filter((group) => group.items.length > 0 || needle === '')
  );
}

export function useCatalogFilter(catalog: EventCatalog, query: string): CatalogGroup[] {
  return useMemo(() => filterCatalog(catalog, query), [catalog, query]);
}
