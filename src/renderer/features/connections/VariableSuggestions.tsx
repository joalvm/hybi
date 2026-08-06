import clsx from 'clsx';
import type { Variable } from '@shared/domain/types.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Button } from '@/shared/ui/Button.js';

type Props = {
  id: string;
  variables: readonly Variable[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onSelect: (name: string) => void;
};

/** Environment suggestions stay presentational so URL editing owns the draft. */
export function VariableSuggestions({
  id,
  variables,
  activeIndex,
  onActiveIndexChange,
  onSelect,
}: Props) {
  const catalog = useMessages();
  const messages = catalog.connections.suggestions;

  if (variables.length === 0) return null;

  return (
    <div
      id={id}
      aria-label={messages.label}
      className="absolute top-full left-0 z-30 mt-1 max-h-58 w-64 overflow-y-auto rounded-ui border border-border bg-panel p-1 shadow-overlay"
      role="listbox"
    >
      {variables.map((variable, index) => (
        <Button
          key={variable.name}
          id={`${id}-${String(index)}`}
          role="option"
          aria-selected={index === activeIndex}
          className={clsx(
            'min-h-7 w-full justify-start border-0 bg-transparent px-1.5 text-left font-ui text-ui font-normal enabled:hover:bg-hover',
            index === activeIndex && 'bg-hover',
          )}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onMouseEnter={() => {
            onActiveIndexChange(index);
          }}
          onClick={() => {
            onSelect(variable.name);
          }}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-ui bg-accent-soft text-label font-semibold text-accent-text"
            >
              {catalog.workspace.environments.initial}
            </span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {variable.name}
            </span>
          </span>
          <span className="max-w-32 overflow-hidden text-ellipsis whitespace-nowrap text-label text-muted">
            {variable.secret
              ? messages.secret
              : variable.value === ''
                ? messages.empty
                : variable.value}
          </span>
        </Button>
      ))}
    </div>
  );
}
