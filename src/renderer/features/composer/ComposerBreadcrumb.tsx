import { CaretRightIcon, CollectionIcon } from '@/shared/ui/icons.js';

type Props = {
  collection: string;
  event: string;
};

/**
 * Where the open payload lives: its collection, then its own name. It takes the
 * place of the panel's `Payload · name` title, which said the same thing with
 * less of it and no way back up the tree.
 */
export function ComposerBreadcrumb({ collection, event }: Props) {
  return (
    <nav className="breadcrumb" aria-label="Ubicación del evento">
      <CollectionIcon className="breadcrumb__icon" />
      <span className="breadcrumb__crumb">{collection}</span>
      <CaretRightIcon className="breadcrumb__separator" />
      <span className="breadcrumb__crumb breadcrumb__crumb--current">{event}</span>
    </nav>
  );
}
