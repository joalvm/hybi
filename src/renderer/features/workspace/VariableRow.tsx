import type { Variable } from '@shared/domain/types.js';
import { IconButton } from '@/shared/ui/IconButton.js';

type Props = {
  variable: Variable;
  index: number;
  onChange: (next: Variable) => void;
  onRemove: () => void;
};

/** Secret values render as a password field so a shared screen never leaks one. */
export function VariableRow({ variable, index, onChange, onRemove }: Props) {
  const position = String(index + 1);
  return (
    <div className="variable-row">
      <input
        className="input"
        aria-label={`Nombre de la variable ${position}`}
        value={variable.name}
        onChange={(event) => {
          onChange({ ...variable, name: event.target.value });
        }}
      />
      <input
        className="input"
        type={variable.secret ? 'password' : 'text'}
        aria-label={`Valor de la variable ${position}`}
        value={variable.value}
        onChange={(event) => {
          onChange({ ...variable, value: event.target.value });
        }}
      />
      <label className="variable-row__secret">
        <input
          type="checkbox"
          checked={variable.secret}
          onChange={(event) => {
            onChange({ ...variable, secret: event.target.checked });
          }}
        />
        secreto
      </label>
      <IconButton label={`Eliminar la variable ${position}`} tone="danger" onClick={onRemove}>
        ✕
      </IconButton>
    </div>
  );
}
