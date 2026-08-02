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
    <div className="catalog-toolbar">
      <CatalogSearch value={query} onChange={onQueryChange} />
      <IconButton label="Nueva colección" onClick={onCreateCollection}>
        <NewCollectionIcon />
      </IconButton>
      <IconButton
        label={importing ? 'Importando AsyncAPI…' : 'Importar AsyncAPI'}
        disabled={importing}
        onClick={onImport}
      >
        {importing ? <SpinnerIcon className="icon-spin" /> : <ImportIcon />}
      </IconButton>
      <IconButton label={allCollapsed ? 'Expandir todo' : 'Contraer todo'} onClick={onToggleAll}>
        {allCollapsed ? <ExpandAllIcon /> : <CollapseAllIcon />}
      </IconButton>
    </div>
  );
}
