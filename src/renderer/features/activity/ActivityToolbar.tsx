import type { ActivityKind } from '@shared/ipc/activity.js';
import { Badge } from '@/shared/ui/Badge.js';
import { Input } from '@/shared/ui/Input.js';
import { ExportIcon, TrashIcon } from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import type { HiddenActivityKinds } from '@/store/ui.slice.js';
import { ActivityKindFilter } from './ActivityKindFilter.js';

type Props = {
  query: string;
  dropped: boolean;
  hidden: HiddenActivityKinds;
  /** False with an empty log: there would be nothing to write. */
  exportable: boolean;
  onQueryChange: (query: string) => void;
  onToggleKind: (kind: ActivityKind) => void;
  onExport: () => void;
  onClear: () => void;
};

/**
 * The badge only appears when the peer closed the socket. A connection nobody
 * opened yet, or one the user closed on purpose, needs no warning — the connect
 * button already says which of the two it is.
 */
export function ActivityToolbar({
  query,
  dropped,
  hidden,
  exportable,
  onQueryChange,
  onToggleKind,
  onExport,
  onClear,
}: Props) {
  return (
    <>
      {dropped && <Badge tone="warn">Desconectado</Badge>}
      <ActivityKindFilter hidden={hidden} onToggle={onToggleKind} />
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
      <IconButton label="Exportar la actividad" disabled={!exportable} onClick={onExport}>
        <ExportIcon />
      </IconButton>
      <IconButton label="Limpiar actividad" tone="danger" onClick={onClear}>
        <TrashIcon />
      </IconButton>
    </>
  );
}
