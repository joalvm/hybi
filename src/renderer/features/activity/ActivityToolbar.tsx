import { Badge } from '@/shared/ui/Badge.js';
import { Input } from '@/shared/ui/Input.js';
import { TrashIcon } from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';

type Props = {
  query: string;
  dropped: boolean;
  onQueryChange: (query: string) => void;
  onClear: () => void;
};

/**
 * The badge only appears when the peer closed the socket. A connection nobody
 * opened yet, or one the user closed on purpose, needs no warning — the connect
 * button already says which of the two it is.
 */
export function ActivityToolbar({ query, dropped, onQueryChange, onClear }: Props) {
  return (
    <>
      {dropped && <Badge tone="warn">Desconectado</Badge>}
      <Input
        className="w-33"
        type="search"
        aria-label="Buscar en la actividad"
        placeholder="Buscar…"
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value);
        }}
      />
      <IconButton label="Limpiar actividad" tone="danger" onClick={onClear}>
        <TrashIcon />
      </IconButton>
    </>
  );
}
