import clsx from 'clsx';
import type { Environment } from '@shared/domain/types.js';

type Props = {
  environments: readonly Environment[];
  selectedId: string | null;
  onSelect: (environmentId: string) => void;
  onCreate: () => void;
};

/** The master half of the variables dialog: which environment is being edited. */
export function EnvironmentList({ environments, selectedId, onSelect, onCreate }: Props) {
  return (
    <aside className="environments">
      <div className="environments__items" role="listbox" aria-label="Entornos">
        {environments.map((environment) => (
          <button
            key={environment.id}
            type="button"
            role="option"
            aria-selected={environment.id === selectedId}
            className={clsx(
              'environments__item',
              environment.id === selectedId && 'environments__item--selected',
            )}
            onClick={() => {
              onSelect(environment.id);
            }}
          >
            {environment.name}
          </button>
        ))}
        {environments.length === 0 && <p className="environments__empty">Sin entornos</p>}
      </div>
      <button type="button" className="button" onClick={onCreate}>
        Nuevo entorno
      </button>
    </aside>
  );
}
