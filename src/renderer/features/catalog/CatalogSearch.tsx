import clsx from 'clsx';
import { FilterIcon } from '@/shared/ui/icons.js';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const FIELD = clsx(
  'flex h-6 w-full shrink items-center gap-1 rounded-ui border border-border bg-chrome p-1.5',
  'focus-within:border-accent focus-within:bg-panel focus-within:outline focus-within:outline-1 focus-within:outline-accent',
);

export function CatalogSearch({ value, onChange }: Props) {
  return (
    <label className={FIELD}>
      <FilterIcon className="shrink-0 text-muted" />
      <input
        type="search"
        className="min-w-0 flex-1 border-0 bg-transparent outline-none"
        value={value}
        placeholder="Filtrar"
        aria-label="Filtrar"
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </label>
  );
}
