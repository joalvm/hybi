import type { TransportKind } from '@shared/domain/connections/connection.js';
import type { WebSocketTransportSettings } from '@shared/domain/connections/websocket.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { SettingsPane } from '@/shared/ui/settings/SettingsPane.js';
import { PairsEditor } from '../../settings/PairsEditor.js';
import { RetryFields } from '../../settings/RetryFields.js';
import { TransportKindField } from '../../settings/TransportKindField.js';
import { AdvancedFields } from './AdvancedFields.js';
import { KeepaliveFields } from './KeepaliveFields.js';

type Props = {
  settings: WebSocketTransportSettings;
  onChange: (next: Partial<WebSocketTransportSettings>) => void;
  onKindChange: (kind: TransportKind) => void;
};

/**
 * Native WebSocket settings, isolated in the adapter's renderer folder. One
 * pane per entry of `WEBSOCKET_SETTINGS_TABS`, which is the list the dialog
 * draws its rail from.
 */
export function WebSocketSettings({ settings, onChange, onKindChange }: Props) {
  const messages = useMessages().connections;
  const tabs = messages.tabs;

  return (
    <>
      <SettingsPane value="connection" title={tabs.connection}>
        <TransportKindField kind="websocket" onChange={onKindChange} />
        <AdvancedFields settings={settings} onChange={onChange} />
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
      <SettingsPane value="keepalive" title={tabs.keepalive}>
        <KeepaliveFields
          keepalive={settings.keepalive}
          onChange={(keepalive) => {
            onChange({ keepalive });
          }}
        />
      </SettingsPane>
    </>
  );
}
