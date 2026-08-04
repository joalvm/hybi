import { useState } from 'react';
import type { Variable } from '@shared/domain/types.js';
import { Button } from '@/shared/ui/Button.js';
import { Popover, type VirtualAnchor } from '@/shared/ui/Popover.js';
import { useStore } from '@/store/index.js';
import { VariablePopoverEditor } from './VariablePopoverEditor.js';

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

  const openVariables = (): void => {
    onClose();
    setDialog('variables');
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
      {/* The panel is raised by pointing, and a pointer moves on: without the
          token written out, nothing on screen says which variable this edits. */}
      <p className="font-mono text-ui text-foreground">{`{{${name}}}`}</p>

      {environment === null ? (
        <p className="text-label text-muted">
          Esta conexión no tiene entorno. Elige uno para definir variables.
        </p>
      ) : variable === null ? (
        <>
          <p className="text-label text-muted">{`No está definida en ${environment.name}.`}</p>
          <Button onClick={create}>
            {`Crear en ${environment.name}`}
          </Button>
        </>
      ) : (
        <>
          <VariablePopoverEditor
            name={name}
            variable={variable}
            draft={draft}
            onDraftChange={setDraft}
            onSave={save}
            onClose={onClose}
          />
          <Button
            aria-label={`Entorno ${environment.name}`}
            className="min-h-0 self-start gap-2 border-0 bg-transparent p-0 text-ui text-muted enabled:hover:bg-transparent enabled:hover:text-foreground"
            onClick={openVariables}
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-ui bg-accent-soft font-semibold text-accent-text"
            >
              E
            </span>
            <span>{environment.name}</span>
          </Button>
        </>
      )}

      {(environment === null || variable === null) && (
        <Button
          className="min-h-0 self-start border-0 bg-transparent p-0 text-label text-accent-text enabled:hover:bg-transparent enabled:hover:underline"
          onClick={openVariables}
        >
          Ver todas las variables
        </Button>
      )}
    </Popover>
  );
}
