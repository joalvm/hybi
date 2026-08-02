import { useState } from 'react';
import type { Variable } from '@shared/domain/types.js';
import { HideIcon, RevealIcon } from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { Popover, type VirtualAnchor } from '@/shared/ui/Popover.js';
import { useStore } from '@/store/index.js';

type Props = {
  /** The name inside the braces, without them. */
  name: string;
  /** The environment the surrounding connection resolves against. */
  environmentId: string | null;
  anchor: VirtualAnchor | null;
  onClose: () => void;
  /** The Monaco hover keeps itself open while the pointer is over the panel. */
  onPointerEnter?: (() => void) | undefined;
  onPointerLeave?: (() => void) | undefined;
};

/**
 * Editing a variable where it is written instead of three clicks away in a
 * dialog. It writes through `setEnvironmentVariables`, which already exists:
 * this replaces one entry in the list it reads, so no new store action appears
 * for a feature that is a different way into the same edit.
 */
export function VariablePopover({
  name,
  environmentId,
  anchor,
  onClose,
  onPointerEnter,
  onPointerLeave,
}: Props) {
  const environment = useStore(
    (state) => state.workspace?.environments.find((entry) => entry.id === environmentId) ?? null,
  );
  const setEnvironmentVariables = useStore((state) => state.setEnvironmentVariables);
  const setDialog = useStore((state) => state.setDialog);

  const variable = environment?.variables.find((entry) => entry.name === name) ?? null;
  // Seeded once per mount. Callers key this component by `name`, so pointing at
  // a second token remounts it rather than syncing the field from an effect —
  // the popover is the only editor of the value while it is open.
  const [draft, setDraft] = useState(variable?.value ?? '');
  const [revealed, setRevealed] = useState(false);

  const write = (next: Variable[]): void => {
    if (environment === null) return;
    setEnvironmentVariables(environment.id, next);
  };

  const save = (): void => {
    if (environment === null || variable === null) return;
    if (variable.value === draft) return;
    write(
      environment.variables.map((entry) =>
        entry.name === name ? { ...entry, value: draft } : entry,
      ),
    );
  };

  const create = (): void => {
    if (environment === null) return;
    write([...environment.variables, { name, value: '', secret: false }]);
  };

  return (
    <Popover
      open={anchor !== null}
      anchor={anchor}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <p className="popover-title">{`{{${name}}}`}</p>

      {environment === null ? (
        <p className="popover-note">
          Esta conexión no tiene entorno. Elige uno para definir variables.
        </p>
      ) : variable === null ? (
        <>
          <p className="popover-note">{`No está definida en ${environment.name}.`}</p>
          <button type="button" className="button" onClick={create}>
            {`Crear en ${environment.name}`}
          </button>
        </>
      ) : (
        <>
          <p className="popover-note">{`Entorno ${environment.name}`}</p>
          <div className="popover-value">
            <input
              className="input"
              // A secret is never printed by default, here or in the log.
              type={variable.secret && !revealed ? 'password' : 'text'}
              aria-label={`Valor de ${name}`}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
              }}
              onBlur={save}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  save();
                  onClose();
                }
                if (event.key === 'Escape') {
                  setDraft(variable.value);
                }
              }}
            />
            {variable.secret && (
              <IconButton
                label={revealed ? 'Ocultar valor' : 'Mostrar valor'}
                onClick={() => {
                  setRevealed((current) => !current);
                }}
              >
                {revealed ? <HideIcon /> : <RevealIcon />}
              </IconButton>
            )}
          </div>
        </>
      )}

      <button
        type="button"
        className="popover-link"
        onClick={() => {
          onClose();
          setDialog('variables');
        }}
      >
        Ver todas las variables
      </button>
    </Popover>
  );
}
