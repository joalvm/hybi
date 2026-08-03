import type { ConnectionTransport } from '@shared/domain/connections/connection.js';
import { WebSocketSettings } from '../websocket/settings/WebSocketSettings.js';

type Props = {
  transport: ConnectionTransport;
  onChange: (transport: ConnectionTransport) => void;
};

/** Exhaustive renderer dispatch; each transport owns its settings component. */
export function TransportSettings({ transport, onChange }: Props) {
  return (
    <WebSocketSettings
      settings={transport.settings}
      onChange={(next) => {
        onChange({
          ...transport,
          settings: { ...transport.settings, ...next },
        });
      }}
    />
  );
}
