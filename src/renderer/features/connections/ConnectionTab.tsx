import { memo } from 'react';
import { format } from '@lang/translate.js';
import type { Connection } from '@shared/domain/types.js';
import type { ConnectionState } from '@shared/ipc/activity.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { DuplicateIcon, RenameIcon, SettingsIcon, TrashIcon } from '@/shared/ui/icons.js';
import { InlineNameInput } from '@/shared/ui/InlineNameInput.js';
import { RowMenu } from '@/shared/ui/RowMenu.js';
import { cn } from '@/shared/utils/cn.js';
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
  const messages = useMessages();
  const label = stateLabel(state, messages.connections.states);
  const tones: Record<typeof label.tone, string> = {
    neutral: 'text-muted',
    ok: 'text-ok',
    warn: 'text-warn',
    error: 'text-error',
  };
  const dot = (
    <span
      aria-hidden="true"
      className={cn('h-2 w-2 shrink-0 rounded-full bg-current', tones[label.tone])}
    />
  );

  return (
    <div
      className={cn(
        'tab-actions-runtime flex h-control shrink-0 items-center rounded-worktab pr-1 hover:bg-elevated',
        active && 'bg-selected hover:bg-selected',
      )}
      data-active={active}
    >
      {renaming ? (
        <div className="flex h-full max-w-56 items-center gap-2 rounded-worktab py-0 pr-1 pl-2 text-muted">
          {dot}
          <InlineNameInput
            value={connection.name}
            label={messages.connections.connectionName}
            onCommit={(name) => {
              onRename(connection.id, name);
            }}
            onCancel={onCancelRename}
          />
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            'flex h-full max-w-56 cursor-pointer items-center gap-2 rounded-worktab border-0 bg-transparent py-0 pr-1 pl-2 text-muted',
            active && 'text-foreground',
          )}
          aria-current={active ? 'true' : undefined}
          title={format(messages.connections.tabTitle, {
            name: connection.name,
            state: label.text,
          })}
          onClick={() => {
            onSelect(connection.id);
          }}
          onDoubleClick={() => {
            onStartRename(connection.id);
          }}
        >
          {dot}
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{connection.name}</span>
        </button>
      )}
      <RowMenu
        label={format(messages.common.optionsFor, { name: connection.name })}
        items={[
          {
            label: messages.common.rename,
            icon: <RenameIcon />,
            onSelect: () => {
              onStartRename(connection.id);
            },
          },
          {
            label: messages.common.duplicate,
            icon: <DuplicateIcon />,
            onSelect: () => {
              onDuplicate(connection.id);
            },
          },
          {
            label: messages.connections.configure,
            icon: <SettingsIcon />,
            onSelect: () => {
              onConfigure(connection.id);
            },
          },
          {
            label: messages.common.delete,
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
