import { useState, type SyntheticEvent } from 'react';
import { Button } from './Button.js';
import { Dialog } from './Dialog.js';
import { Field } from './Field.js';
import { Input } from './Input.js';

type Props = {
  open: boolean;
  title: string;
  initial: string;
  label?: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
};

/**
 * One name, one field. Everything nameable — workspaces, collections — asks the
 * same question, so it asks it in the same place.
 *
 * The state starts from the prop instead of syncing through an effect: callers
 * mount this when the dialog opens and unmount it when it closes.
 */
export function NameDialog({ open, title, initial, label = 'Nombre', onSubmit, onClose }: Props) {
  const [name, setName] = useState(initial);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(name.trim());
  };

  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={submit}>
        <Field label={label} htmlFor="name-dialog-value">
          <Input
            id="name-dialog-value"
            value={name}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" tone="primary" disabled={name.trim() === ''}>
            Guardar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
