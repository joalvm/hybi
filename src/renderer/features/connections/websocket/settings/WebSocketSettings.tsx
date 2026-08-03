import type { WebSocketTransportSettings } from '@shared/domain/connections/websocket.js';
import { AdvancedFields } from './AdvancedFields.js';
import { HeadersEditor } from './HeadersEditor.js';
import { KeepaliveFields } from './KeepaliveFields.js';
import { RetryFields } from './RetryFields.js';

type Props = {
  settings: WebSocketTransportSettings;
  onChange: (next: Partial<WebSocketTransportSettings>) => void;
};

/** Native WebSocket settings, isolated in the adapter's renderer folder. */
export function WebSocketSettings({ settings, onChange }: Props) {
  return (
    <>
      <HeadersEditor
        headers={settings.headers}
        onChange={(headers) => {
          onChange({ headers });
        }}
      />
      <RetryFields
        retry={settings.retry}
        onChange={(retry) => {
          onChange({ retry });
        }}
      />
      <KeepaliveFields
        keepalive={settings.keepalive}
        onChange={(keepalive) => {
          onChange({ keepalive });
        }}
      />
      <AdvancedFields settings={settings} onChange={onChange} />
    </>
  );
}
