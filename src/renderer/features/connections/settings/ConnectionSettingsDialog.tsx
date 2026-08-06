import { format } from '@lang/translate.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { SettingsDialog } from '@/shared/ui/settings/SettingsDialog.js';
import { useStore } from '@/store/index.js';
import { settingsTabsFor } from './tabs.js';
import { TransportSettings } from './TransportSettings.js';

type Props = { connectionId: string; onClose: () => void };

/**
 * How a connection is dialled. Everything here belongs to this connection and
 * to no other: there is no workspace or app layer above it, so what the panel
 * shows is exactly what the next handshake carries.
 *
 * The only component in the group that reads the store — the panes take their
 * slice and a callback, which is what keeps each of them testable alone.
 *
 * Edits land in the workspace as they are made and autosave carries them to
 * disk, like every other edit in the app. There is no Save button and no
 * Cancel: the socket, not the dialog, is what a change is waiting on.
 */
export function ConnectionSettingsDialog({ connectionId, onClose }: Props) {
  const messages = useMessages();
  const connection = useStore(
    (state) => state.workspace?.connections.find((entry) => entry.id === connectionId) ?? null,
  );
  const state = useStore((store) => store.states[connectionId] ?? 'idle');
  const upsertConnection = useStore((store) => store.upsertConnection);

  if (connection === null) return null;

  const { transport } = connection;
  const live = state === 'open' || state === 'connecting';

  return (
    <SettingsDialog
      open
      title={format(messages.connections.settingsTitle, { name: connection.name })}
      tabs={settingsTabsFor(transport, messages)}
      notice={
        live ? (
          <p className="border-b border-border bg-chrome px-6 py-2 text-label text-muted">
            {messages.connections.liveNotice}
          </p>
        ) : undefined
      }
      onClose={onClose}
    >
      <TransportSettings
        transport={transport}
        onChange={(next) => {
          upsertConnection({ ...connection, transport: next });
        }}
      />
    </SettingsDialog>
  );
}
