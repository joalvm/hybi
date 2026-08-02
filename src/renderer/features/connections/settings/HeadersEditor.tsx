import type { ConnectionHeader } from '@shared/domain/types.js';
import { HeaderRow } from './HeaderRow.js';

type Props = {
  headers: ConnectionHeader[];
  onChange: (headers: ConnectionHeader[]) => void;
};

/**
 * The headers the handshake carries, in the order they are listed.
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
    <section className="settings-section">
      <div className="settings-section__heading">
        <h3 className="settings-section__title">Headers</h3>
        <button
          type="button"
          className="settings-section__add settings-section__add--inline"
          aria-label="Añadir cabecera"
          title="Añadir cabecera"
          onClick={() => {
            onChange([...headers, { name: '', value: '', enabled: true }]);
          }}
        >
          [+]
        </button>
      </div>
      <p className="settings-hint">
        Los valores admiten <code>{'{{variables}}'}</code>. Un token va en una variable secreta
        del entorno: escrito aquí quedaría guardado en el archivo del workspace.
      </p>
      {headers.length === 0 ? (
        <p className="settings-empty">Sin cabeceras.</p>
      ) : (
        <ul className="headers-list">
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
    </section>
  );
}
