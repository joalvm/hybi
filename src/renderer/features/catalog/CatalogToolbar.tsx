import { useMessages } from '@/shared/i18n/useMessages.js';
import {
  CollapseAllIcon,
  ExpandAllIcon,
  ImportIcon,
  NewCollectionIcon,
  SpinnerIcon,
} from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { CatalogSearch } from './CatalogSearch.js';

type Props = {
  query: string;
  /** An import in flight, which greys its button and spins its glyph. */
  importing: boolean;
  allCollapsed: boolean;
  onQueryChange: (value: string) => void;
  onCreateCollection: () => void;
  onImport: () => void;
  onToggleAll: () => void;
};

/** These sit next to the filter field, so they take its height, not the row's. */
const ACTION = 'h-6 min-h-6 min-w-6';

/**
 * One row where the panel title used to be: the field, then the three things
 * that act on the whole tree. The collapse button is a single toggle — it folds
 * everything shut, and once everything is shut it opens everything — because two
 * buttons would leave one of them dead most of the time.
 */
export function CatalogToolbar({
  query,
  importing,
  allCollapsed,
  onQueryChange,
  onCreateCollection,
  onImport,
  onToggleAll,
}: Props) {
  const messages = useMessages().catalog;

  return (
    <div className="flex shrink-0 items-center gap-1.5 self-stretch pt-1">
      <div className="flex min-w-0 flex-1 items-center pl-1">
        <CatalogSearch value={query} onChange={onQueryChange} />
      </div>
      <div className="flex min-w-0 items-center justify-end gap-0.5">
        <IconButton
          className={ACTION}
          label={allCollapsed ? messages.expandAll : messages.collapseAll}
          onClick={onToggleAll}
        >
          {allCollapsed ? <ExpandAllIcon /> : <CollapseAllIcon />}
        </IconButton>
        <IconButton className={ACTION} label={messages.newCollection} onClick={onCreateCollection}>
          <NewCollectionIcon />
        </IconButton>
        <IconButton
          className={ACTION}
          label={importing ? messages.importing : messages.import}
          disabled={importing}
          onClick={onImport}
        >
          {importing ? <SpinnerIcon className="icon-spin" /> : <ImportIcon />}
        </IconButton>
      </div>
    </div>
  );
}
