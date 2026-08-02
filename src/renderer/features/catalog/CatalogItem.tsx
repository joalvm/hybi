import clsx from 'clsx';
import { memo } from 'react';
import type { EventItem } from '@shared/domain/types.js';
import { InlineNameInput } from '@/shared/ui/InlineNameInput.js';
import { CatalogItemMenu } from './CatalogItemMenu.js';
import type { CatalogRowActions } from './useCatalogActions.js';

type Props = {
  item: EventItem;
  selected: boolean;
  /** True for the one row being named, which is at most one in the tree. */
  renaming: boolean;
  /** The tree's roving tabindex: only the active row is tabbable. */
  tabIndexFor: (id: string) => 0 | -1;
  onSelect: (id: string) => void;
  actions?: CatalogRowActions | undefined;
};

/**
 * A row is a name and a `…`, nothing else. Where an event came from lives in the
 * title instead of a badge, so a hundred rows still read as a list of names.
 * Memoized because a selection or a rename only ever repaints two of them.
 */
export const CatalogItem = memo(function CatalogItem({
  item,
  selected,
  renaming,
  tabIndexFor,
  onSelect,
  actions,
}: Props) {
  return (
    <li
      role="treeitem"
      aria-level={2}
      aria-selected={selected}
      aria-label={item.name}
      data-row-id={item.id}
      tabIndex={tabIndexFor(item.id)}
      title={item.source === 'asyncapi' ? `${item.name} — importado de AsyncAPI` : item.name}
      className={clsx('catalog-item', selected && 'catalog-item--selected')}
      onClick={() => {
        onSelect(item.id);
      }}
      onDoubleClick={() => {
        actions?.rename(item.id);
      }}
    >
      {renaming && actions !== undefined ? (
        <InlineNameInput
          value={item.name}
          label="Nombre del evento"
          onCommit={(name) => {
            actions.commitRename(item.id, name);
          }}
          onCancel={actions.cancelRename}
        />
      ) : (
        <span className="catalog-item-name">{item.name}</span>
      )}
      {actions !== undefined && <CatalogItemMenu item={item} actions={actions} />}
    </li>
  );
});
