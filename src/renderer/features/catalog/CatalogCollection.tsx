import {
  CaretDownIcon,
  CaretRightIcon,
  PlusIcon,
  RenameIcon,
  TrashIcon,
} from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { InlineNameInput } from '@/shared/ui/InlineNameInput.js';
import { RowMenu } from '@/shared/ui/RowMenu.js';
import { CatalogItem } from './CatalogItem.js';
import type { CatalogGroup } from './useCatalogFilter.js';
import type { CatalogRowActions } from './useCatalogActions.js';
type Props = {
  group: CatalogGroup;
  selectedId: string | null;
  renamingId?: string | null;
  expanded: boolean;
  tabIndexFor: (id: string) => 0 | -1;
  onToggleCollection: (collectionId: string) => void;
  onSelect: (id: string) => void;
  actions?: CatalogRowActions | undefined;
};

/** Collapsed state lives in the store: it is view state, not workspace data, so it never persists. */
export function CatalogCollection({
  group,
  selectedId,
  renamingId = null,
  expanded,
  tabIndexFor,
  onToggleCollection,
  onSelect,
  actions,
}: Props) {
  const collection = group.collection;
  const renaming = collection.id === renamingId;
  // A collapsed collection still opens for the row being named: creating an
  // event folds the tree open around it rather than hiding what it just made.
  const open = expanded || group.items.some((item) => item.id === renamingId);

  // The field replaces the toggle rather than sitting inside it: an input nested
  // in a button is neither valid nor clickable.
  const heading =
    renaming && actions !== undefined ? (
      <div className="flex min-h-row min-w-0 flex-1 items-center gap-1 px-2 font-semibold text-muted">
        <CaretDownIcon className="shrink-0" />
        <InlineNameInput
          value={collection.name}
          label="Nombre de la colección"
          onCommit={(name) => {
            actions.commitRenameCollection(collection.id, name);
          }}
          onCancel={actions.cancelRename}
        />
      </div>
    ) : (
      <button
        type="button"
        className="flex min-h-row min-w-0 flex-1 cursor-pointer items-center gap-1 border-0 bg-transparent px-2 font-semibold text-muted focus-visible:bg-hover focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-accent"
        role="treeitem"
        aria-level={1}
        aria-expanded={open}
        data-row-id={collection.id}
        tabIndex={tabIndexFor(collection.id)}
        onClick={() => {
          onToggleCollection(collection.id);
        }}
        onDoubleClick={() => {
          actions?.renameCollection(collection);
        }}
      >
        {open ? (
          <CaretDownIcon className="shrink-0" />
        ) : (
          <CaretRightIcon className="shrink-0" />
        )}
        <span className="flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap">
          {collection.name}
        </span>
      </button>
    );

  return (
    <div>
      <div className="catalog-actions-runtime flex min-h-row items-center pr-1 hover:bg-hover">
        {heading}
        {actions !== undefined && (
          <IconButton
            className="catalog-action-runtime"
            label={`Nuevo evento en ${collection.name}`}
            onClick={() => {
              actions.createIn(collection.id);
            }}
          >
            <PlusIcon />
          </IconButton>
        )}
        {actions !== undefined && (
          <RowMenu
            label={`Opciones de ${collection.name}`}
            items={[
              {
                label: 'Nuevo evento',
                icon: <PlusIcon />,
                onSelect: () => {
                  actions.createIn(collection.id);
                },
              },
              {
                label: 'Renombrar',
                icon: <RenameIcon />,
                onSelect: () => {
                  actions.renameCollection(collection);
                },
              },
              {
                label: 'Eliminar',
                icon: <TrashIcon />,
                tone: 'danger',
                onSelect: () => {
                  actions.removeCollection(collection);
                },
              },
            ]}
          />
        )}
      </div>
      {open && (
        <ul
          role="group"
          aria-label={collection.name}
          className="ml-4 list-none border-l border-border p-0"
        >
          {group.items.map((item) => (
            <CatalogItem
              key={item.id}
              item={item}
              selected={item.id === selectedId}
              renaming={item.id === renamingId}
              tabIndexFor={tabIndexFor}
              onSelect={onSelect}
              actions={actions}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
