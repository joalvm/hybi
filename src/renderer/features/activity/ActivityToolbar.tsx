import type { ActivityKind } from '@shared/ipc/activity.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
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
  const messages = useMessages();

  return (
    <>
      {dropped && <Badge tone="warn">{messages.activity.dropped}</Badge>}
      <ActivityKindFilter hidden={hidden} onToggle={onToggleKind} />
      <Input
        className="w-33"
        type="search"
        aria-label={messages.activity.search}
        placeholder={messages.common.search}
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value);
        }}
      />
      <IconButton label={messages.activity.export} disabled={!exportable} onClick={onExport}>
        <ExportIcon />
      </IconButton>
      <IconButton label={messages.activity.clear} tone="danger" onClick={onClear}>
        <TrashIcon />
      </IconButton>
    </>
  );
}
