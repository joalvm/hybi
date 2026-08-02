import type { Connection } from '@shared/domain/types.js';
import { useStore } from '@/store/index.js';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog.js';
import { PlusIcon } from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { ConnectionTab } from './ConnectionTab.js';
import { ConnectionSettingsDialog } from './settings/ConnectionSettingsDialog.js';
import { useConnectionTabActions } from './useConnectionTabActions.js';

/** A module constant so an unloaded workspace keeps a stable empty list. */
const EMPTY_CONNECTIONS: Connection[] = [];

/**
 * The tab strip and the two dialogs it can raise. What each action does lives
 * in `useConnectionTabActions`, which is what keeps this file about layout.
 */
export function ConnectionTabs() {
  const connections = useStore((state) => state.workspace?.connections ?? EMPTY_CONNECTIONS);
  const states = useStore((state) => state.states);
  const activeConnectionId = useStore((state) => state.activeConnectionId);
  /**
   * Mounted here rather than in the connection bar: the tab menu opens it too,
   * and the bar disappears with the connection the dialog is about.
   */
  const settingsConnectionId = useStore((state) => state.settingsConnectionId);
  const actions = useConnectionTabActions();

  const closing = connections.find((entry) => entry.id === actions.closingId) ?? null;

  return (
    <div className="connection-tabs-bar">
      <div className="connection-tabs">
        {connections.map((connection) => (
          <ConnectionTab
            key={connection.id}
            connection={connection}
            state={states[connection.id] ?? 'idle'}
            active={connection.id === activeConnectionId}
            renaming={connection.id === actions.renamingId}
            onSelect={actions.select}
            onStartRename={actions.startRename}
            onRename={actions.rename}
            onCancelRename={actions.cancelRename}
            onDuplicate={actions.duplicate}
            onConfigure={actions.configure}
            onRequestClose={actions.requestClose}
          />
        ))}
      </div>
      {/* Outside the strip: the tabs scroll, the button that adds one does not. */}
      <div className="connection-tabs__add">
        <IconButton label="Nueva conexión" onClick={actions.create}>
          <PlusIcon />
        </IconButton>
      </div>
      {settingsConnectionId !== null && (
        <ConnectionSettingsDialog
          // A remount per connection: every field inside seeds its draft from
          // the store when it mounts, so switching connections has to be a new
          // component rather than the same one handed different props.
          key={settingsConnectionId}
          connectionId={settingsConnectionId}
          onClose={() => {
            useStore.getState().closeConnectionSettings();
          }}
        />
      )}
      {closing !== null && (
        <ConfirmDialog
          open
          title="Eliminar conexión"
          message={`¿Eliminar "${closing.name}"? Se cierra el socket y la conexión desaparece del workspace. No se puede deshacer.`}
          onConfirm={() => {
            actions.remove(closing.id);
          }}
          onClose={actions.cancelClose}
        />
      )}
    </div>
  );
}
