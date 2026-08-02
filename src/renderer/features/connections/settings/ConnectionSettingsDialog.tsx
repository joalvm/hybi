import type { ConnectionSettings } from '@shared/domain/types.js';
import { Dialog } from '@/shared/ui/Dialog.js';
import { useStore } from '@/store/index.js';
import { AdvancedFields } from './AdvancedFields.js';
import { HeadersEditor } from './HeadersEditor.js';
import { KeepaliveFields } from './KeepaliveFields.js';
import { RetryFields } from './RetryFields.js';

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

  const { settings } = connection;
  const update = (next: Partial<ConnectionSettings>): void => {
    upsertConnection({ ...connection, settings: { ...settings, ...next } });
  };

  return (
    <Dialog
      open
      size="settings"
      title={`Configuración · ${connection.name}`}
      bodyClassName="dialog-body--settings"
      onClose={onClose}
    >
      <div className="connection-settings">
        {(state === 'open' || state === 'connecting') && (
          <p className="settings-note">
            El socket sigue abierto: lo que cambies aquí se aplica al volver a conectar.
          </p>
        )}
        <HeadersEditor
          headers={settings.headers}
          onChange={(headers) => {
            update({ headers });
          }}
        />
        <RetryFields
          retry={settings.retry}
          onChange={(retry) => {
            update({ retry });
          }}
        />
        <KeepaliveFields
          keepalive={settings.keepalive}
          onChange={(keepalive) => {
            update({ keepalive });
          }}
        />
        <AdvancedFields settings={settings} onChange={update} />
        
      </div>
    </Dialog>
  );
}
