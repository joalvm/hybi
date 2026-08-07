import type { TransportKind } from '@shared/domain/connections/connection.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Select } from '@/shared/ui/Select.js';
import { SettingsRow } from '@/shared/ui/settings/SettingsRow.js';

type Props = {
  kind: TransportKind;
  onChange: (kind: TransportKind) => void;
};

/**
 * Which protocol this connection speaks — the first row of every transport's
 * own pane, because it is the answer the rest of the pane depends on.
 *
 * Changing it starts the new transport from its defaults, URL included. The
 * settings below are not the same settings on the other side, and carrying half
 * of one configuration into another is how a connection ends up looking ready
 * and failing on the first dial.
 */
export function TransportKindField({ kind, onChange }: Props) {
  const messages = useMessages().connections.transport;

  return (
    <SettingsRow
      label={messages.label}
      description={messages.description}
      control={
        <Select
          label={messages.label}
          className="w-52"
          value={kind}
          options={[
            { value: 'websocket', label: messages.websocket },
            { value: 'socketio', label: messages.socketio },
          ]}
          onChange={(next) => {
            onChange(next === 'socketio' ? 'socketio' : 'websocket');
          }}
        />
      }
    />
  );
}
