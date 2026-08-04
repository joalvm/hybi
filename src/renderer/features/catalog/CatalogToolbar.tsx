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
  return (
    <div className="flex items-center shrink-0 self-stretch gap-1.5 pt-1">
      <div className="items-center min-w-0 flex flex-1">
        <CatalogSearch value={query} onChange={onQueryChange} />
      </div>
      <div className="gap-0.5 items-center justify-end min-w-0 flex">
        <IconButton className='h-6 min-h-6 min-w-6' label={allCollapsed ? 'Expandir todo' : 'Contraer todo'} onClick={onToggleAll}>
          {allCollapsed ? <ExpandAllIcon /> : <CollapseAllIcon />}
        </IconButton>
        <IconButton  className='h-6 min-h-6 min-w-6' label="Nueva colección" onClick={onCreateCollection}>
          <NewCollectionIcon />
        </IconButton>
        <IconButton
          className='h-6 min-h-6 min-w-6'
          label={importing ? 'Importando AsyncAPI…' : 'Importar AsyncAPI'}
          disabled={importing}
          onClick={onImport}
        >
          {importing ? <SpinnerIcon className="icon-spin" /> : <ImportIcon />}
        </IconButton>
      </div>
    </div>
  );
}
