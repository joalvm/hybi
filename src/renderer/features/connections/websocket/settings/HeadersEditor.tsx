import type { ConnectionHeader } from '@shared/domain/connections/websocket.js';
import { Button } from '@/shared/ui/Button.js';
import { PlusIcon } from '@/shared/ui/icons.js';
import { HeaderRow } from './HeaderRow.js';

type Props = {
  headers: ConnectionHeader[];
  onChange: (headers: ConnectionHeader[]) => void;
};

/**
 * WebSocket handshake headers, in the order they are listed.
 *
 * Rows are keyed by position because a header has no id of its own: the list is
 * short, every field is controlled, and the alternative is an identifier stored
 * in the workspace file that nothing else would ever read.
 */
export function HeadersEditor({ headers, onChange }: Props) {
  const replace = (index: number, header: ConnectionHeader): void => {
    onChange(headers.map((entry, position) => (position === index ? header : entry)));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-label leading-copy text-muted">
        Los valores admiten <code>{'{{variables}}'}</code>. Un token va en una variable secreta del
        entorno: escrito aquí quedaría guardado en el archivo del workspace.
      </p>
      {headers.length === 0 ? (
        <p className="text-ui leading-4 text-muted">Sin cabeceras.</p>
      ) : (
        <ul className="flex list-none flex-col gap-1 p-0">
          {headers.map((header, index) => (
            <HeaderRow
              key={index}
              header={header}
              onChange={(next) => {
                replace(index, next);
              }}
              onRemove={() => {
                onChange(headers.filter((_entry, position) => position !== index));
              }}
            />
          ))}
        </ul>
      )}
      <Button
        className="self-start"
        aria-label="Añadir cabecera"
        onClick={() => {
          onChange([...headers, { name: '', value: '', enabled: true }]);
        }}
      >
        <PlusIcon />
        Añadir cabecera
      </Button>
    </div>
  );
}
