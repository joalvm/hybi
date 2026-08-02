import type { CatalogGroup } from './useCatalogFilter.js';

/** One line of the tree as the keyboard sees it: a collection or an event. */
export type TreeRow =
  | { kind: 'collection'; id: string }
  | { kind: 'item'; id: string; collectionId: string };

export type TreeAction =
  | { type: 'focus'; id: string }
  | { type: 'toggle'; id: string }
  | { type: 'open'; id: string }
  | { type: 'rename'; id: string }
  | { type: 'delete'; id: string }
  | null;

/** The rows a user can actually reach: a collapsed collection hides its events. */
export function flattenRows(groups: CatalogGroup[], collapsed: Record<string, true>): TreeRow[] {
  const rows: TreeRow[] = [];
  for (const group of groups) {
    rows.push({ kind: 'collection', id: group.collection.id });
    if (collapsed[group.collection.id] === true) continue;
    for (const item of group.items) {
      rows.push({ kind: 'item', id: item.id, collectionId: group.collection.id });
    }
  }
  return rows;
}

/**
 * Pure on purpose: no DOM, no store. Everything the tree does with a key is
 * decided here, so the whole contract is testable as a table.
 */
export function treeKeyAction(
  rows: TreeRow[],
  collapsed: Record<string, true>,
  currentId: string | null,
  key: string,
): TreeAction {
  if (rows.length === 0) return null;
  const index = rows.findIndex((row) => row.id === currentId);
  const row = rows[index];

  const at = (target: number): TreeAction => {
    const found = rows[target];
    return found === undefined ? null : { type: 'focus', id: found.id };
  };

  if (key === 'Home') return at(0);
  if (key === 'End') return at(rows.length - 1);
  if (key === 'ArrowDown') return at(index === -1 ? 0 : index + 1);
  if (key === 'ArrowUp') return at(index === -1 ? rows.length - 1 : index - 1);

  if (row === undefined) return null;

  if (key === 'ArrowRight') {
    if (row.kind !== 'collection') return null;
    // Shut: open it. Already open: the next row is its first child.
    return collapsed[row.id] === true ? { type: 'toggle', id: row.id } : at(index + 1);
  }

  if (key === 'ArrowLeft') {
    if (row.kind === 'item') return { type: 'focus', id: row.collectionId };
    return collapsed[row.id] === true ? null : { type: 'toggle', id: row.id };
  }

  if (key === 'Enter') {
    return row.kind === 'item' ? { type: 'open', id: row.id } : { type: 'toggle', id: row.id };
  }

  if (key === 'F2') return { type: 'rename', id: row.id };
  if (key === 'Delete') return { type: 'delete', id: row.id };

  return null;
}
