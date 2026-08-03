import type { ConnectionHeader } from '@shared/domain/connections/websocket.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { TrashIcon } from '@/shared/ui/icons.js';

type Props = {
  header: ConnectionHeader;
  onChange: (header: ConnectionHeader) => void;
  onRemove: () => void;
};

/** The name of an unnamed row, so its controls still have something to say. */
function nameOf(header: ConnectionHeader): string {
  return header.name === '' ? 'la cabecera sin nombre' : header.name;
}

/**
 * One header. The value is a template: a secret belongs in a `{{variable}}` of
 * the environment, which is the mechanism that keeps it out of the workspace
 * file — typed in here it would be written to disk in the clear.
 */
export function HeaderRow({ header, onChange, onRemove }: Props) {
  return (
    <li className="header-row">
      <input
        type="checkbox"
        checked={header.enabled}
        aria-label={`Enviar ${nameOf(header)}`}
        onChange={(event) => {
          onChange({ ...header, enabled: event.target.checked });
        }}
      />
      <input
        className="input header-row__name"
        value={header.name}
        placeholder="Authorization"
        aria-label="Nombre de la cabecera"
        onChange={(event) => {
          onChange({ ...header, name: event.target.value });
        }}
      />
      <input
        className="input header-row__value"
        value={header.value}
        placeholder="Bearer {{token}}"
        aria-label="Valor de la cabecera"
        onChange={(event) => {
          onChange({ ...header, value: event.target.value });
        }}
      />
      <IconButton label={`Quitar ${nameOf(header)}`} tone="danger" onClick={onRemove}>
        <TrashIcon />
      </IconButton>
    </li>
  );
}
