import { SearchIcon } from '@/shared/ui/icons.js';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function CatalogSearch({ value, onChange }: Props) {
  return (
    <label className="flex min-h-control w-34 min-w-24 shrink items-center gap-1 rounded-ui border border-border bg-chrome pr-1 pl-2 focus-within:border-accent focus-within:bg-panel focus-within:outline focus-within:outline-1 focus-within:outline-accent">
      <SearchIcon className="shrink-0 text-muted" />
      <input
        type="search"
        className="min-w-0 flex-1 border-0 bg-transparent outline-none"
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
