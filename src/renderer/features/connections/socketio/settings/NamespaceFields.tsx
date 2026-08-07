import { useId } from 'react';
import type { SocketIoTransportSettings } from '@shared/domain/connections/socketio.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Input } from '@/shared/ui/Input.js';
import { SettingsRow } from '@/shared/ui/settings/SettingsRow.js';
import { TransportsField } from './TransportsField.js';

type Props = {
  settings: SocketIoTransportSettings;
  onChange: (next: Partial<SocketIoTransportSettings>) => void;
};

/**
 * The two paths a Socket.IO server is configured with, and which engines may
 * carry them. `path` is where engine.io is mounted on the HTTP server; the
 * namespace is which part of the API is joined once it is. They are easy to
 * mistake for one another, which is why each says what it is under its own name.
 */
export function NamespaceFields({ settings, onChange }: Props) {
  const messages = useMessages().connections.socketio;
  const namespaceId = useId();
  const pathId = useId();

  return (
    <div className="flex flex-col">
      <SettingsRow
        label={messages.namespace.label}
        description={messages.namespace.description}
        htmlFor={namespaceId}
        control={
          <Input
            id={namespaceId}
            className="w-52 font-mono"
            value={settings.namespace}
            placeholder={messages.namespace.placeholder}
            onChange={(event) => {
              onChange({ namespace: event.target.value });
            }}
          />
        }
      />
      <SettingsRow
        label={messages.path.label}
        description={messages.path.description}
        htmlFor={pathId}
        control={
          <Input
            id={pathId}
            className="w-52 font-mono"
            value={settings.path}
            placeholder={messages.path.placeholder}
            onChange={(event) => {
              onChange({ path: event.target.value });
            }}
          />
        }
      />
      <TransportsField
        transports={settings.transports}
        onChange={(transports) => {
          onChange({ transports });
        }}
      />
    </div>
  );
}
