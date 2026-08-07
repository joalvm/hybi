import type { TransportKind } from '@shared/domain/connections/connection.js';
import type { SocketIoTransportSettings } from '@shared/domain/connections/socketio.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { SettingsPane } from '@/shared/ui/settings/SettingsPane.js';
import { PairsEditor } from '../../settings/PairsEditor.js';
import { RetryFields } from '../../settings/RetryFields.js';
import { TransportKindField } from '../../settings/TransportKindField.js';
import { NamespaceFields } from './NamespaceFields.js';
import { SocketIoAdvanced } from './SocketIoAdvanced.js';

type Props = {
  settings: SocketIoTransportSettings;
  onChange: (next: Partial<SocketIoTransportSettings>) => void;
  onKindChange: (kind: TransportKind) => void;
};

/**
 * Socket.IO settings, isolated in the adapter's renderer folder. One pane per
 * entry of `socketIoSettingsTabs`, which is the list the dialog draws its rail
 * from.
 */
export function SocketIoSettings({ settings, onChange, onKindChange }: Props) {
  const messages = useMessages().connections;
  const tabs = messages.tabs;

  return (
    <>
      <SettingsPane value="connection" title={tabs.connection}>
        <TransportKindField kind="socketio" onChange={onKindChange} />
        <NamespaceFields settings={settings} onChange={onChange} />
      </SettingsPane>
      <SettingsPane value="auth" title={tabs.auth}>
        <PairsEditor
          pairs={settings.auth}
          labels={messages.socketio.auth}
          onChange={(auth) => {
            onChange({ auth });
          }}
        />
      </SettingsPane>
      <SettingsPane value="headers" title={tabs.headers}>
        <PairsEditor
          pairs={settings.headers}
          labels={messages.headers}
          onChange={(headers) => {
            onChange({ headers });
          }}
        />
      </SettingsPane>
      <SettingsPane value="retry" title={tabs.retry}>
        <RetryFields
          retry={settings.retry}
          onChange={(retry) => {
            onChange({ retry });
          }}
        />
      </SettingsPane>
      <SettingsPane value="advanced" title={tabs.advanced}>
        <SocketIoAdvanced settings={settings} onChange={onChange} />
      </SettingsPane>
    </>
  );
}
