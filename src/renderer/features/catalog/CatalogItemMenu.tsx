import type { EventItem } from '@shared/domain/types.js';
import {
  CollectionIcon,
  DuplicateIcon,
  RenameIcon,
  TrashIcon,
} from '@/shared/ui/icons.js';
import { RowMenu, type RowMenuGroup } from '@/shared/ui/RowMenu.js';
import type { CatalogRowActions } from './useCatalogActions.js';

type Props = { item: EventItem; actions: CatalogRowActions };

/**
 * Every row action behind one `…`, so a long catalog reads as names. Moving is a
 * group of plain buttons rather than a `<select>`: a menu that mixes widgets
 * cannot be walked with the arrow keys alone.
 */
export function CatalogItemMenu({ item, actions }: Props) {
  const targets = actions.collections.filter((entry) => entry.id !== item.collectionId);
  const groups: RowMenuGroup[] =
    targets.length === 0
      ? []
      : [
          {
            label: 'Mover a',
            items: targets.map((collection) => ({
              label: collection.name,
              icon: <CollectionIcon />,
              onSelect: () => {
                actions.move(item.id, collection.id);
              },
            })),
          },
        ];

  return (
    <RowMenu
      label={`Opciones de ${item.name}`}
      items={[
        {
          label: 'Renombrar',
          icon: <RenameIcon />,
          onSelect: () => {
            actions.rename(item.id);
          },
        },
        {
          label: 'Duplicar',
          icon: <DuplicateIcon />,
          onSelect: () => {
            actions.duplicate(item);
          },
        },
        {
          label: 'Eliminar',
          icon: <TrashIcon />,
          tone: 'danger',
          onSelect: () => {
            actions.remove(item);
          },
        },
      ]}
      groups={groups}
    />
  );
}
