import type { WebSocketTransportSettings } from '@shared/domain/connections/websocket.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { SettingsPane } from '@/shared/ui/settings/SettingsPane.js';
import { AdvancedFields } from './AdvancedFields.js';
import { HeadersEditor } from './HeadersEditor.js';
import { KeepaliveFields } from './KeepaliveFields.js';
import { RetryFields } from './RetryFields.js';

type Props = {
  settings: WebSocketTransportSettings;
  onChange: (next: Partial<WebSocketTransportSettings>) => void;
};

/**
 * Native WebSocket settings, isolated in the adapter's renderer folder. One
 * pane per entry of `WEBSOCKET_SETTINGS_TABS`, which is the list the dialog
 * draws its rail from.
 */
export function WebSocketSettings({ settings, onChange }: Props) {
  const tabs = useMessages().connections.tabs;

  return (
    <>
      <SettingsPane value="connection" title={tabs.connection}>
        <AdvancedFields settings={settings} onChange={onChange} />
      </SettingsPane>
      <SettingsPane value="headers" title={tabs.headers}>
        <HeadersEditor
          headers={settings.headers}
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
