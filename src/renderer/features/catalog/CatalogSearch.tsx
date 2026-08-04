import { SearchIcon } from '@/shared/ui/icons.js';
import clsx from 'clsx';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const InnerContainer = clsx(
  'flex h-6 w-full shrink items-center p-1.5 gap-1 rounded-ui border border-border bg-chrome',
  'focus-within:border-accent focus-within:bg-panel focus-within:outline focus-within:outline-1 focus-within:outline-accent',
);

export function CatalogSearch({ value, onChange }: Props) {
  return (
    <div className="flex flex-col w-full pl-1">
      <span className="cursor-default select-none w-max"></span>
      <div className={InnerContainer}>
        <SearchIcon className="shrink-0 text-muted" />
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
      </div>
    </div>
  );
}
