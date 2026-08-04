import { useShallow } from 'zustand/react/shallow';
import { selectScopeFor } from '@/store/selectors.js';
import { useStore } from '@/store/index.js';
import { WebSocketConnectionBar } from './websocket/WebSocketConnectionBar.js';

type Props = { connectionId: string };

/**
 * Store-aware root. Each transport owns its endpoint controls and its own
 * translation to the bridge; picking between them lands here once there is more
 * than one, on the same terms as `TransportSettings`.
 */
export function ConnectionBar({ connectionId }: Props) {
  const connection = useStore(
    (state) => state.workspace?.connections.find((entry) => entry.id === connectionId) ?? null,
  );
  // `useShallow` compares the scope entry by entry, so the map keeps its
  // identity between renders and `resolution` is not recomputed for nothing.
  const scope = useStore(useShallow(selectScopeFor(connectionId)));
  const state = useStore((store) => store.states[connectionId] ?? 'idle');
  const upsertConnection = useStore((store) => store.upsertConnection);
  const setConnectionState = useStore((store) => store.setConnectionState);
  const appendLocalError = useStore((store) => store.appendLocalError);
  const openSettings = useStore((store) => store.openConnectionSettings);
  if (connection === null) return null;

  return (
    <WebSocketConnectionBar
      connectionId={connectionId}
      environmentId={connection.environmentId}
      transport={connection.transport}
      scope={scope}
      state={state}
      onTransportChange={(transport) => {
        upsertConnection({ ...connection, transport });
      }}
      onStateChange={(next) => {
        setConnectionState(connectionId, next);
      }}
      onLocalError={(message) => {
        appendLocalError(connectionId, connection.transport.kind, message);
      }}
      onOpenSettings={() => {
        openSettings(connectionId);
      }}
    />
  );
}
