import { useState } from 'react';
import { format } from '@lang/translate.js';
import type { Environment, Variable } from '@shared/domain/types.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Button } from '@/shared/ui/Button.js';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog.js';
import { Dialog } from '@/shared/ui/Dialog.js';
import { Input } from '@/shared/ui/Input.js';
import { useStore } from '@/store/index.js';
import { EnvironmentList } from './EnvironmentList.js';
import { VariableRow } from './VariableRow.js';

/** A module constant so an unloaded workspace keeps a stable empty list. */
const EMPTY_ENVIRONMENTS: Environment[] = [];

/**
 * Master-detail: the environments on the left, the variables of the selected one
 * on the right. Creating one asks for nothing but a name — the list of variables
 * is what you fill in afterwards, and the name is editable in place.
 */
export function VariablesDialog() {
  const catalog = useMessages();
  const messages = catalog.workspace;
  const open = useStore((state) => state.dialog === 'variables');
  const environments = useStore((state) => state.workspace?.environments ?? EMPTY_ENVIRONMENTS);
  const setDialog = useStore((state) => state.setDialog);
  const addEnvironment = useStore((state) => state.addEnvironment);
  const renameEnvironment = useStore((state) => state.renameEnvironment);
  const removeEnvironment = useStore((state) => state.removeEnvironment);
  const setEnvironmentVariables = useStore((state) => state.setEnvironmentVariables);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  // Falls back to the first environment instead of storing it in an effect: the
  // list changes under this dialog every time one is added or removed.
  const current = environments.find((entry) => entry.id === selectedId) ?? environments[0] ?? null;
  const variables = current?.variables ?? [];

  const write = (next: Variable[]): void => {
    if (current !== null) setEnvironmentVariables(current.id, next);
  };

  const create = (): void => {
    addEnvironment(
      format(messages.environments.created, { number: environments.length + 1 }),
    );
    const created = useStore.getState().workspace?.environments.at(-1);
    if (created) setSelectedId(created.id);
  };

  return (
    <Dialog
      open={open}
      title={messages.variables.title}
      size="lg"
      onClose={() => {
        setDialog(null);
      }}
    >
      <div className="variables-grid grid min-h-72 gap-3">
        <EnvironmentList
          environments={environments}
          selectedId={current?.id ?? null}
          onSelect={setSelectedId}
          onCreate={create}
        />

        <section className="flex min-w-0 flex-col gap-2">
          {current === null ? (
            <p className="text-label text-muted">{messages.variables.noEnvironment}</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Input
                  aria-label={messages.environments.name}
                  value={current.name}
                  onChange={(event) => {
                    renameEnvironment(current.id, event.target.value);
                  }}
                />
                <Button
                  tone="danger"
                  onClick={() => {
                    setConfirming(true);
                  }}
                >
                  {catalog.common.delete}
                </Button>
              </div>

              <p className="text-label text-muted">{messages.variables.secretNote}</p>

              {variables.map((variable, index) => (
                <VariableRow
                  key={`${current.id}:${String(index)}`}
                  variable={variable}
                  index={index}
                  onChange={(next) => {
                    write(variables.map((entry, position) => (position === index ? next : entry)));
                  }}
                  onRemove={() => {
                    write(variables.filter((_entry, position) => position !== index));
                  }}
                />
              ))}

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    write([...variables, { name: '', value: '', secret: false }]);
                  }}
                >
                  {messages.variables.add}
                </Button>
              </div>
            </>
          )}
        </section>
      </div>

      {confirming && current !== null && (
        <ConfirmDialog
          open
          title={messages.environments.delete.title}
          message={format(messages.environments.delete.message, { name: current.name })}
          onConfirm={() => {
            removeEnvironment(current.id);
            setSelectedId(null);
            setConfirming(false);
          }}
          onClose={() => {
            setConfirming(false);
          }}
        />
      )}
    </Dialog>
  );
}
