import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { EventCatalog } from '@shared/domain/types.js';
import { useStore } from '@/store/index.js';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog.js';
import { SpinnerIcon } from '@/shared/ui/icons.js';
import { Panel } from '@/shared/ui/Panel.js';
import { CatalogToolbar } from './CatalogToolbar.js';
import { CatalogTree } from './CatalogTree.js';
import { useAsyncApiImport } from './useAsyncApiImport.js';
import { useCatalogActions, type CatalogRowActions } from './useCatalogActions.js';
import { useCatalogFilter } from './useCatalogFilter.js';

/** A module constant so an unloaded workspace keeps a stable catalog reference. */
const EMPTY_CATALOG: EventCatalog = { collections: [], items: [] };

type Props = { connectionId: string };

/** The only component in this feature that reads the store. Children take props. */
export function CatalogPanel({ connectionId }: Props) {
  const { catalog, query, selectedId, collapsed } = useStore(
    useShallow((state) => ({
      catalog: state.workspace?.catalog ?? EMPTY_CATALOG,
      query: state.catalogQuery,
      selectedId: state.selectedEventByConnection[connectionId] ?? null,
      collapsed: state.collapsedCollections,
    })),
  );
  const setCatalogQuery = useStore((state) => state.setCatalogQuery);
  const setSelectedEvent = useStore((state) => state.setSelectedEvent);
  const toggleCollection = useStore((state) => state.toggleCollection);
  const collapseAllCollections = useStore((state) => state.collapseAllCollections);
  const expandAllCollections = useStore((state) => state.expandAllCollections);
  const asyncapi = useAsyncApiImport();

  const {
    confirm,
    renamingId,
    close,
    createIn,
    rename,
    commitRename,
    cancelRename,
    duplicateItem,
    deleteItem,
    createCollection,
    renameCollection,
    commitRenameCollection,
    deleteCollection,
    moveItem,
  } = useCatalogActions(connectionId);

  const groups = useCatalogFilter(catalog, query);

  // Read off the visible groups rather than the whole catalog: a search narrows
  // what the button can act on, so it must narrow what it reports too.
  const allCollapsed =
    groups.length > 0 && groups.every((group) => collapsed[group.collection.id] === true);

  const toggleAll = (): void => {
    if (allCollapsed) {
      expandAllCollections();
      return;
    }
    collapseAllCollections(groups.map((group) => group.collection.id));
  };

  // Memoized as one object: `CatalogItem` is memoized, so a fresh identity here
  // would repaint every row on every keystroke in the search box.
  const rowActions = useMemo<CatalogRowActions>(
    () => ({
      collections: catalog.collections,
      rename,
      commitRename,
      cancelRename,
      duplicate: duplicateItem,
      remove: deleteItem,
      move: moveItem,
      createIn,
      renameCollection,
      commitRenameCollection,
      removeCollection: deleteCollection,
    }),
    [
      catalog.collections,
      rename,
      commitRename,
      cancelRename,
      duplicateItem,
      deleteItem,
      moveItem,
      createIn,
      renameCollection,
      commitRenameCollection,
      deleteCollection,
    ],
  );

  return (
    <Panel surface="chrome">
      <div className="flex h-full min-h-0 flex-col bg-chrome">
        {/* No "new event" here: an event needs a collection to live in, so the
            action belongs to a collection's own menu and nowhere else. */}
        <CatalogToolbar
          query={query}
          importing={asyncapi.importing}
          allCollapsed={allCollapsed}
          onQueryChange={setCatalogQuery}
          onCreateCollection={createCollection}
          onImport={asyncapi.start}
          onToggleAll={toggleAll}
        />
        {/* A big document takes seconds to parse in the main process, and until
            this line existed the app simply stopped answering. */}
        {asyncapi.importing && (
          <p className="flex items-center gap-2 border-b border-border px-3 py-2 text-label text-muted" role="status">
            <SpinnerIcon className="icon-spin" />
            Leyendo el documento AsyncAPI…
          </p>
        )}
        <h3 className="px-2 pt-2 pb-1 text-label font-semibold tracking-section text-muted uppercase">
          Colecciones
        </h3>
        <CatalogTree
          groups={groups}
          selectedId={selectedId}
          renamingId={renamingId}
          collapsed={collapsed}
          actions={rowActions}
          onToggleCollection={toggleCollection}
          onSelect={(eventId) => {
            setSelectedEvent(connectionId, eventId);
          }}
        />
      </div>
      {/* The one dialog the catalog still raises. Naming happens in the row it
          names; only a delete is worth interrupting for. */}
      {confirm !== null && (
        <ConfirmDialog
          open
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.confirm}
          onClose={close}
        />
      )}
    </Panel>
  );
}
