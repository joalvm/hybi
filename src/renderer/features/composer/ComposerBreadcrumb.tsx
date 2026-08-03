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
    <nav
      className="flex min-h-9 items-center gap-1 px-3 pt-2 pb-1 text-label text-muted"
      aria-label="Ubicación del evento"
    >
      <CollectionIcon className="shrink-0" />
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{collection}</span>
      <CaretRightIcon className="shrink-0" />
      <span className="overflow-hidden font-semibold text-ellipsis whitespace-nowrap text-foreground">
        {event}
      </span>
    </nav>
  );
}
