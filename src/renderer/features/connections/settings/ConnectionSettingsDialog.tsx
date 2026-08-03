import { Dialog } from '@/shared/ui/Dialog.js';
import { useStore } from '@/store/index.js';
import { TransportSettings } from './TransportSettings.js';

type Props = { connectionId: string; onClose: () => void };

/**
 * How a connection is dialled. Everything here belongs to this connection and
 * to no other: there is no workspace or app layer above it, so what the panel
 * shows is exactly what the next handshake carries.
 *
 * The only component in the group that reads the store — the sections take
 * their slice and a callback, which is what keeps each of them testable alone.
 *
 * Edits land in the workspace as they are made and autosave carries them to
 * disk, like every other edit in the app. There is no Save button and no
 * Cancel: the socket, not the dialog, is what a change is waiting on.
 */
export function ConnectionSettingsDialog({ connectionId, onClose }: Props) {
  const connection = useStore(
    (state) => state.workspace?.connections.find((entry) => entry.id === connectionId) ?? null,
  );
  const state = useStore((store) => store.states[connectionId] ?? 'idle');
  const upsertConnection = useStore((store) => store.upsertConnection);

  if (connection === null) return null;

  const { transport } = connection;

  return (
    <Dialog
      open
      size="settings"
      title={`Configuración · ${connection.name}`}
      bodyClassName="pt-0 pb-0"
      onClose={onClose}
    >
      <div className="flex flex-col gap-0 pb-4">
        {(state === 'open' || state === 'connecting') && (
          <p className="border-l-2 border-border bg-chrome px-3 py-2 text-label text-muted">
            El socket sigue abierto: lo que cambies aquí se aplica al volver a conectar.
          </p>
        )}
        <TransportSettings
          transport={transport}
          onChange={(next) => {
            upsertConnection({ ...connection, transport: next });
          }}
        />
      </div>
    </Dialog>
  );
}
