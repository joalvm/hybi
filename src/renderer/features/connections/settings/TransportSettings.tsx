import type { ConnectionTransport } from '@shared/domain/connections/connection.js';
import { WebSocketSettings } from '../websocket/settings/WebSocketSettings.js';

type Props = {
  transport: ConnectionTransport;
  onChange: (transport: ConnectionTransport) => void;
};

/**
 * Where the settings panel of each transport is chosen. There is no dispatch yet
 * because there is nothing to dispatch on: `ConnectionTransport` has one member,
 * and a one-member union cannot be narrowed — `no-unnecessary-condition` rejects
 * the guard as always true. Adding a transport is what makes the branch legal,
 * and `TransportFactoryMap` is what will refuse to compile until it exists.
 */
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
