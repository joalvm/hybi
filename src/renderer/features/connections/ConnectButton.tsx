import clsx from 'clsx';
import type { ConnectionState } from '@shared/ipc/activity.js';

type Props = {
  state: ConnectionState;
  canConnect: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

/**
 * `connecting` counts as connected so the button becomes the cancel affordance
 * while the handshake or a backoff retry is still in flight.
 *
 * Two looks, not four: solid blue while the socket is shut, because opening it
 * is the one thing this bar is for, and a quiet grey once it is up. Colour
 * spent on a live connection would keep shouting at a user who is by then
 * reading the log, and the dot on the tab already carries the state.
 */
export function ConnectButton({ state, canConnect, onConnect, onDisconnect }: Props) {
  const connected = state === 'open' || state === 'connecting';
  return (
    <button
      type="button"
      className={clsx(
        'button',
        'connect-button',
        connected ? 'connect-button--live' : 'connect-button--idle',
      )}
      disabled={!connected && !canConnect}
      onClick={connected ? onDisconnect : onConnect}
    >
      {connected ? 'Desconectar' : 'Conectar'}
    </button>
  );
}
