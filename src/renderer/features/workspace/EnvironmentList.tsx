import type { Environment } from '@shared/domain/types.js';
import { Button } from '@/shared/ui/Button.js';
import { cn } from '@/shared/utils/cn.js';

type Props = {
  environments: readonly Environment[];
  selectedId: string | null;
  onSelect: (environmentId: string) => void;
  onCreate: () => void;
};

/** The master half of the variables dialog: which environment is being edited. */
export function EnvironmentList({ environments, selectedId, onSelect, onCreate }: Props) {
  return (
    <aside className="flex flex-col gap-2 border-r border-border pr-3">
      <div className="flex flex-1 flex-col gap-px" role="listbox" aria-label="Entornos">
        {environments.map((environment) => (
          <button
            key={environment.id}
            type="button"
            role="option"
            aria-selected={environment.id === selectedId}
            className={cn(
              'cursor-pointer rounded-ui border-0 bg-transparent px-2 py-1 text-left hover:bg-hover focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent',
              environment.id === selectedId && 'bg-selected',
            )}
            onClick={() => {
              onSelect(environment.id);
            }}
          >
            {environment.name}
          </button>
        ))}
        {environments.length === 0 && <p className="text-label text-muted">Sin entornos</p>}
      </div>
      <Button onClick={onCreate}>Nuevo entorno</Button>
    </aside>
  );
}
