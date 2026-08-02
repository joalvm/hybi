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
      <div className="catalog-collection-toggle">
        <CaretDownIcon className="catalog-collection-caret" />
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
        className="catalog-collection-toggle"
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
          <CaretDownIcon className="catalog-collection-caret" />
        ) : (
          <CaretRightIcon className="catalog-collection-caret" />
        )}
        <span className="catalog-collection-name">{collection.name}</span>
      </button>
    );

  return (
    <div className="catalog-collection">
      <div className="catalog-collection-header">
        {heading}
        {actions !== undefined && (
          <IconButton
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
        <ul role="group" aria-label={collection.name} className="catalog-collection-items">
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
