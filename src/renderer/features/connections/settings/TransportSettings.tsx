import type { ConnectionTransport } from '@shared/domain/connections/connection.js';
import { SocketIoSettings } from '../socketio/settings/SocketIoSettings.js';
import { WebSocketSettings } from '../websocket/settings/WebSocketSettings.js';

type Props = {
  transport: ConnectionTransport;
  onChange: (transport: ConnectionTransport) => void;
};

/**
 * Where the settings panel of each transport is chosen. The switch returns a
 * different pane per branch and the function has to return one, so a transport
 * with no branch is a compile error rather than an empty dialog.
 *
 * Each branch spreads its own narrowed transport, which is what keeps a
 * Socket.IO namespace from being merged into a WebSocket's settings by a shared
 * handler that only saw the union.
 */
export function TransportSettings({ transport, onChange }: Props) {
  switch (transport.kind) {
    case 'websocket':
      return (
        <WebSocketSettings
          settings={transport.settings}
          onChange={(next) => {
            onChange({ ...transport, settings: { ...transport.settings, ...next } });
          }}
        />
      );
    case 'socketio':
      return (
        <SocketIoSettings
          settings={transport.settings}
          onChange={(next) => {
            onChange({ ...transport, settings: { ...transport.settings, ...next } });
          }}
        />
      );
  }
}
