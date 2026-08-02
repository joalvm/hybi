import clsx from 'clsx';
import { memo } from 'react';
import type { Connection } from '@shared/domain/types.js';
import type { ConnectionState } from '@shared/ipc/activity.js';
import { DuplicateIcon, RenameIcon, SettingsIcon, TrashIcon } from '@/shared/ui/icons.js';
import { InlineNameInput } from '@/shared/ui/InlineNameInput.js';
import { RowMenu } from '@/shared/ui/RowMenu.js';
import { stateLabel } from './state-label.js';

type Props = {
  connection: Connection;
  state: ConnectionState;
  active: boolean;
  /** True for the one tab whose name is being typed. */
  renaming: boolean;
  onSelect: (connectionId: string) => void;
  onStartRename: (connectionId: string) => void;
  onRename: (connectionId: string, name: string) => void;
  onCancelRename: () => void;
  onDuplicate: (connectionId: string) => void;
  onConfigure: (connectionId: string) => void;
  /** Opens the confirmation. Deleting a connection is never one click. */
  onRequestClose: (connectionId: string) => void;
};

/**
 * Memoized so a state event on one socket repaints one tab. The dot is
 * `aria-hidden` and the state travels in the button title, keeping the
 * accessible name equal to the connection name.
 *
 * A double click on the name turns the tab into a rename field — the gesture a
 * tab strip answers to everywhere else. The field replaces the button rather
 * than sitting inside it: an input nested in a button is neither valid nor
 * clickable.
 *
 * The `…` carries rename, duplicate and delete. There is no (x): a tab sits one
 * pixel from the name it belongs to, and closing one destroys a saved
 * connection, so deleting asks first.
 */
export const ConnectionTab = memo(function ConnectionTab({
  connection,
  state,
  active,
  renaming,
  onSelect,
  onStartRename,
  onRename,
  onCancelRename,
  onDuplicate,
  onConfigure,
  onRequestClose,
}: Props) {
  const label = stateLabel(state);
  const dot = (
    <span aria-hidden="true" className={clsx('connection-dot', `connection-dot--${label.tone}`)} />
  );

  return (
    <div className={clsx('connection-tab', active && 'connection-tab--active')}>
      {renaming ? (
        <div className="connection-tab-select">
          {dot}
          <InlineNameInput
            value={connection.name}
            label="Nombre de la conexión"
            onCommit={(name) => {
              onRename(connection.id, name);
            }}
            onCancel={onCancelRename}
          />
        </div>
      ) : (
        <button
          type="button"
          className="connection-tab-select"
          aria-current={active ? 'true' : undefined}
          title={`${connection.name} — ${label.text} (doble clic para renombrar)`}
          onClick={() => {
            onSelect(connection.id);
          }}
          onDoubleClick={() => {
            onStartRename(connection.id);
          }}
        >
          {dot}
          <span className="connection-tab-name">{connection.name}</span>
        </button>
      )}
      <RowMenu
        label={`Opciones de ${connection.name}`}
        items={[
          {
            label: 'Renombrar',
            icon: <RenameIcon />,
            onSelect: () => {
              onStartRename(connection.id);
            },
          },
          {
            label: 'Duplicar',
            icon: <DuplicateIcon />,
            onSelect: () => {
              onDuplicate(connection.id);
            },
          },
          {
            label: 'Configuración',
            icon: <SettingsIcon />,
            onSelect: () => {
              onConfigure(connection.id);
            },
          },
          {
            label: 'Eliminar',
            icon: <TrashIcon />,
            tone: 'danger',
            onSelect: () => {
              onRequestClose(connection.id);
            },
          },
        ]}
      />
    </div>
  );
});
