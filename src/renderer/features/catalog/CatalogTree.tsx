import { useMemo } from 'react';
import { CatalogCollection } from './CatalogCollection.js';
import { flattenRows, type TreeRow } from './treeKeyboard.js';
import { useTreeKeyboard } from './useTreeKeyboard.js';
import type { CatalogGroup } from './useCatalogFilter.js';
import type { CatalogRowActions } from './useCatalogActions.js';

type Props = {
  groups: CatalogGroup[];
  selectedId: string | null;
  /** The row being named, if any. Kept out of `actions` so a rename repaints two rows. */
  renamingId?: string | null;
  /** Absent key means expanded, so a collection created later opens. */
  collapsed: Record<string, true>;
  onSelect: (id: string) => void;
  onToggleCollection: (collectionId: string) => void;
  // `| undefined` is explicit because `exactOptionalPropertyTypes` is on and
  // the tree forwards the prop straight through.
  actions?: CatalogRowActions | undefined;
};

/**
 * Store-free on purpose: props in, callbacks out. That is what lets a test
 * render the tree without standing up the workspace.
 *
 * A real `role="tree"`: the keyboard walks the rows that are visible, and the
 * roving tabindex means Tab leaves the sidebar instead of stepping through two
 * hundred events.
 */
export function CatalogTree({
  groups,
  selectedId,
  renamingId = null,
  collapsed,
  onSelect,
  onToggleCollection,
  actions,
}: Props) {
  const rows = useMemo(() => flattenRows(groups, collapsed), [groups, collapsed]);

  const remove = (row: TreeRow): void => {
    if (actions === undefined) return;
    if (row.kind === 'collection') {
      const collection = actions.collections.find((entry) => entry.id === row.id);
      if (collection !== undefined) actions.removeCollection(collection);
      return;
    }
    const item = groups.flatMap((group) => group.items).find((entry) => entry.id === row.id);
    if (item !== undefined) actions.remove(item);
  };

  const { containerRef, onKeyDown, tabIndexFor } = useTreeKeyboard({
    rows,
    collapsed,
    onToggle: onToggleCollection,
    onOpen: onSelect,
    onRename: (row) => {
      if (row.kind === 'collection') {
        const collection = actions?.collections.find((entry) => entry.id === row.id);
        if (collection !== undefined) actions?.renameCollection(collection);
        return;
      }
      actions?.rename(row.id);
    },
    onDelete: remove,
  });

  if (groups.length === 0) {
    return <p className="p-3 text-muted">No hay eventos que coincidan.</p>;
  }

  return (
    <div
      ref={containerRef}
      role="tree"
      aria-label="Colecciones"
      onKeyDown={onKeyDown}
      className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
    >
      {groups.map((group) => (
        <CatalogCollection
          key={group.collection.id}
          group={group}
          selectedId={selectedId}
          renamingId={renamingId}
          expanded={collapsed[group.collection.id] !== true}
          tabIndexFor={tabIndexFor}
          onSelect={onSelect}
          onToggleCollection={onToggleCollection}
          actions={actions}
        />
      ))}
    </div>
  );
}
