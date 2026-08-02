import { SearchIcon } from '@/shared/ui/icons.js';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function CatalogSearch({ value, onChange }: Props) {
  return (
    <label className="catalog-search">
      <SearchIcon className="catalog-search__icon" />
      <input
        type="search"
        className="catalog-search__field"
        value={value}
        placeholder="Buscar evento"
        aria-label="Buscar evento"
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </label>
  );
}
